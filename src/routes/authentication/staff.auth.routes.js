const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const crypto = require("crypto");
const config = require("../../utils/config")
const {sendEmail} = require("../../email/emailService")
const generateTokens = require("../../utils/tokenHelper")

/* =====================================================
   STAFF LOGIN
===================================================== */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const emp = await prisma.employee.findUnique({ where: { email } });

    if (!emp) {
      return res.status(402).json({
        success: false,
        message: "No Account Found ",
      });
    }

    if (emp.status !== 'ACTIVE') {
      return res.status(402).json({
        success: false,
        message: "Account is inactive. Please contact administrator.",
        status: emp.status // Optional: send status for debugging
      });
    }

    // ✅ Direct password comparison (no bcrypt)
   if (password !== emp.password) {
      return res.status(402).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const { accessToken, refreshToken } = generateTokens({
        id: emp.employeeId,
        role: emp.role,
      });


    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        employeeId: emp.employeeId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.NODE_ENV === "production",
   
    });

    return res.status(200).json({
      message: "Login successful", accessToken ,role:emp.role, employeeId :emp.employeeId});
  } catch {
    res.status(500).json({ success: false,
      message: "Internal server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email)

    const employee = await prisma.employee.findUnique({ where: { email } });
    console.log(employee)

    if (!employee) {
      return res.json({ message: "Staff Not Found"});
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.employee.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const resetLink = `http://localhost:5173/staff/reset-password?token=${token}`;

    // await sendEmail({
    //   eventName: "FORGOT_PASSWORD",
    //   to: email,   // ✅ THIS IS WHERE EMAIL GOES
    //   subject: "Reset Password",
    //   html: `<a href="${resetLink}">Click to reset password</a>`
    // });

    await sendEmail({
        eventName: "FORGOT_PASSWORD",
        to: email,
        subject: "Reset Your Password - Insight Consulting",
        html: `
        <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
          
          <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden;">
      
            <!-- HEADER -->
            <div style="background:#ff3c1f; padding:20px; text-align:center;">
              <img src="https://ik.imagekit.io/vqdzxla6k/insights%20consultancy%20/landingPage/image%2033%201%20(1)%201.png" 
                   alt="Insight Consulting" 
                   style="height:50px;" />
            </div>
      
            <!-- BODY -->
            <div style="padding:30px;">
              <h2 style="color:#333;">Reset Your Password</h2>
      
              <p>We received a request to reset your password.</p>
      
              <div style="text-align:center; margin:30px 0;">
                <a href="${resetLink}" 
                   style="background:#ff3c1f; color:white; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:bold;">
                   Reset Password
                </a>
              </div>
      
              <p style="color:#555;">If you didn’t request this, you can safely ignore this email.</p>
      
              <p style="color:red; font-size:14px;">
                ⚠️ This link will expire in 24 hours.
              </p>
            </div>
      
            <!-- FOOTER -->
            <div style="background:#fafafa; padding:15px; text-align:center; font-size:12px; color:#888;">
              © ${new Date().getFullYear()} Insight Consulting
            </div>
      
          </div>
        </div>
        `
      });

    console.log("EMPLOYEE RESET LINK:", resetLink);

    res.json({ message: "reset link sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

     // ✅ validation
     if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!employee) {
      return res.status(400).json({ message: "Invalid or Expired Link" });
    }

    await prisma.employee.update({
      where: { email: employee.email },
      data: {
        password: newPassword, // ⚠️ hash in production
        resetToken: null,
        resetTokenExpiry: null,
        isFirstLogin: false,  
        inviteStatus: "COMPLETED"
      },
    });

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router









