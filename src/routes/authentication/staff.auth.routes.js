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

   const link = "https://insightconsulting.info/admin/login"
   const hrefWebsiteLink = "https://insightconsulting.info"
   const WebsiteLink = "www.insightconsulting.info"
   const companyName = "Insight Consulting"

   await sendEmail({ 
  eventName: "LOGIN_ALERT", 
  to: emp.email, 
  subject: "New Login to Your Account", 

  html: ` 
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;"> 
    <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;"> 

      <!-- Accent border title --> 
      <div style="border-left: 3px solid #f13c20; padding-left: 16px; margin-bottom: 24px;"> 
        <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">New login to your account</h2> 
        <p style="margin: 0; font-size: 13px; color: #888;">Security alert</p> 
      </div> 

      <!-- Message --> 
      <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 10px;"> 
        A new login was detected on your account. If this was you, no action is needed. 
      </p> 
      <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 24px;"> 
        If this wasn't you, please update your password immediately to secure your account. 
      </p> 

      <!-- Warning box --> 
      <div style="background: #fff5f4; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #fcc;"> 
        <p style="margin: 0; font-size: 13px; color: #b33; line-height: 1.6;"> 
          Didn't log in? Your account may be at risk. Change your password now. 
        </p> 
      </div> 

      <!-- Button --> 
      <a href="${link}" 
         style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;"> 
        Update Password 
      </a> 

      <!-- Divider --> 
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" /> 

      <!-- Footer --> 
      <p style="margin: 0 0 6px; color: #aaa; font-size: 12px; text-align: center;"> 
        This is a security email from <strong style="color: #888;">${companyName}</strong>. 
      </p> 
      <p style="margin: 0; font-size: 12px; text-align: center;"> 
        <a href="${hrefWebsiteLink}" style="color: #f13c20; text-decoration: none;">${WebsiteLink}</a> 
      </p> 

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
    const hrefWebsiteLink = "https://insightconsulting.info"
    const WebsiteLink = "www.insightconsulting.info"
    const companyName = "Insight Consulting"

    await sendEmail({
        eventName: "FORGOT_PASSWORD",
        to: user.email,
        subject: "Reset Your Password",
      
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;">
          <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;">
      
            <!-- Accent border title -->
            <div style="border-left: 3px solid #f13c20; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">Reset your password</h2>
              <p style="margin: 0; font-size: 13px; color: #888;">Password reset request</p>
            </div>
      
            <!-- Message -->
            <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 10px;">
              We received a request to reset your password. Click the button below to continue.
            </p>
            <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
              If you didn't request this, you can safely ignore this email — your password will not be changed.
            </p>
      
            <!-- Warning box -->
            <div style="background: #fff5f4; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #fcc;">
              <p style="margin: 0; font-size: 13px; color: #b33; line-height: 1.6;">
                This link will expire in 15 minutes. Request a new one if it expires.
              </p>
            </div>
      
            <!-- Button -->
            <a href="${resetLink}"
               style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
              Reset Password
            </a>
      
            <!-- Divider -->
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" />
      
            <!-- Footer -->
            <p style="margin: 0 0 6px; color: #aaa; font-size: 12px; text-align: center;">
              This is a security email from <strong style="color: #888;">${companyName}</strong>.
            </p>
            <p style="margin: 0; font-size: 12px; text-align: center;">
              <a href="${hrefWebsiteLink}" style="color: #f13c20; text-decoration: none;">${WebsiteLink}</a>
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

    const loginLink = "https://insightconsultancy.netlify.app/admin/login";
    const hrefWebsiteLink = "https://insightconsulting.info"
    const WebsiteLink = "www.insightconsulting.info"
    const companyName = "Insight Consulting"
    await sendEmail({
        eventName: "PASSWORD_RESET_SUCCESS",
        to: employee.email,
        subject: "Your password has been updated",
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;">
          <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;">
            <div style="border-left: 3px solid #f13c20; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">Password updated</h2>
              <p style="margin: 0; font-size: 13px; color: #888;">Account security notice</p>
            </div>
            <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 10px;">
              Your password has been successfully updated. You can now log in to your account using your new credentials.
            </p>
            <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
              For your security, all active sessions have been signed out. Please log in again to continue.
            </p>
            <div style="background: #fff5f4; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #fcc;">
              <p style="margin: 0; font-size: 13px; color: #b33; line-height: 1.6;">
                If you did not make this change, contact support immediately as your account may be compromised.
              </p>
            </div>
            <a href="${loginLink}"
               style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
              Log in to your account
            </a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" />
            <p style="margin: 0 0 6px; color: #aaa; font-size: 12px; text-align: center;">
              This is a security email from <strong style="color: #888;">${companyName}</strong>.
            </p>
            <p style="margin: 0; font-size: 12px; text-align: center;">
              <a href="${hrefWebsiteLink}" style="color: #f13c20; text-decoration: none;">${WebsiteLink}</a>
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









