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

    await sendEmail({
        eventName: "LOGIN_ALERT",
        to: emp.email,
        subject: "New Login Detected",
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f6f7f9; padding:50px 20px;">
          
          <div style="max-width:460px; margin:auto; background:#ffffff; border-radius:12px; padding:32px; border:1px solid #eaeaea;">
            
            <!-- Title -->
            <h2 style="margin:0 0 12px; font-size:18px; font-weight:600; color:#111;">
              New login detected
            </h2>
      
            <!-- Message -->
            <p style="margin:0 0 20px; font-size:14px; color:#555; line-height:1.6;">
              Your account was accessed from a new device or location.
            </p>
      
            <!-- Info Card -->
            <div style="background:#fafafa; border:1px solid #eee; border-radius:8px; padding:14px; font-size:13px; color:#333; line-height:1.6;">
              <div><strong>IP address:</strong> ${req.ip}</div>
              <div><strong>Device:</strong> ${req.headers["user-agent"]}</div>
              <div><strong>Time:</strong> ${new Date().toLocaleString()}</div>
            </div>
      
            <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
      
            <!-- Action -->
            <p style="font-size:13px; color:#666; margin:0;">
              If this wasn’t you, reset your password immediately.
            </p>
      
            <!-- Button -->
            <div style="margin-top:18px;">
              <a href="${resetLink}" 
                 style="display:inline-block; background:#111; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none; font-size:13px;">
                Secure account
              </a>
            </div>
      
          </div>
        </div>
        `
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
    // console.log(email)

    const employee = await prisma.employee.findUnique({ where: { email } });
    // console.log(employee)

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

    const resetLink = `https://insightconsultancy.netlify.app/reset-password?token=${token}`;

    await sendEmail({
           eventName: "FORGOT_PASSWORD",
           to: email,
           subject: "Reset Your Password",
           html: `
           <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f9fafb; padding:20px 10px;">
             
             <div style="max-width:480px; margin:auto; background:#ffffff; border-radius:8px; padding:30px; border:1px solid #eee;">
         
               <!-- Title -->
               <h2 style="margin:0 0 10px; color:#111; font-weight:600;">
                 Reset your password
               </h2>
         
               <!-- Message -->
               <p style="color:#555; font-size:14px; line-height:1.6;">
                 We received a request to reset your password. Click the button below to continue.
               </p>
         
               <!-- Button -->
               <div style="margin:25px 0; text-align:center;">
                 <a href="${resetLink}" 
                    style="background:#f13c20; color:#fff; padding:10px 20px; text-decoration:none; border-radius:6px; font-size:14px; display:inline-block;">
                   Reset Password
                 </a>
               </div>
         
               <!-- Expiry -->
               <p style="color:#888; font-size:12px; text-align:center;">
                 This link will expire in 15 minutes.
               </p>
         
               <!-- Divider -->
               <hr style="border:none; border-top:1px solid #eee; margin:25px 0;" />
         
               <!-- Footer -->
               <p style="color:#aaa; font-size:12px; text-align:center;">
                 If you didn’t request this, you can safely ignore this email.
               </p>
         
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

    await sendEmail({
            eventName: "PASSWORD_RESET_SUCCESS",
            to: employee.email,
            subject: "Password Has Been Updated Successfully",
            html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; background:#f9fafb; padding:20px 10px; text-align:center;">
              
              <div style="max-width:420px; margin:auto; background:#fff; padding:40px 25px; border-radius:10px; border:1px solid #eee;">
                
                <h2 style="margin:0 0 15px; color:#111; font-weight:600;">
                  Password updated
                </h2>
          
                <p style="color:#666; font-size:14px; line-height:1.6; margin-bottom:25px;">
                  Your password has been successfully changed.
                </p>
          
                <a href="https://insightconsultancy.netlify.app/admin/login" 
                   style="background:#f13c20; color:#fff; padding:12px 22px; text-decoration:none; border-radius:6px; font-size:14px; display:inline-block;">
                  Login to your account
                </a>
          
                <p style="color:#aaa; font-size:12px; margin-top:25px;">
                  Didn’t do this? Contact support immediately.
                </p>
          
              </div>
            </div>
            `
          });

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router









