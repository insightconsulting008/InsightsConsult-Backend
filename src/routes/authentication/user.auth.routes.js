const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const config = require("../../utils/config")
const {sendEmail} = require("../../email/emailService")
const generateTokens = require("../../utils/tokenHelper")

/* =====================================================
   USER REGISTER
===================================================== */

router.post("/register", async (req, res) => {
  try {
    const { name, email, phoneNumber, password , utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      refCode,} = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let utmCampaignId = null;

    if (utmCampaign) {
      const campaignData = await prisma.utmCampaign.findUnique({
        where: { campaignName: utmCampaign }, // ✅ FIXED
        select: { utmCampaignId: true },
      });

      utmCampaignId = campaignData?.utmCampaignId || null;
    }

      // 2️⃣ Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
  
      if (existingUser) {
        return res.status(402).json({
          success: false,
          message: "Email already registered",
        });
      }

      

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, phoneNumber, password: hashed , // ✅ Save only if exists, else null
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaignName: utmCampaign || null, // ✅ FIXED
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        refCode: refCode || null,

        // 🔗 Relation
        utmCampaignId: utmCampaignId || null,}
    });

    const { accessToken, refreshToken } = generateTokens({
        id: user.userId,
        role: user.role,
      });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.NODE_ENV === "production",
     
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      role:user.role,
      accessToken,
      userId: user.userId,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });

  }
});
/* =====================================================
   USER LOGIN
===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

     // Validate input
     if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

   // ✅ Email not found
   if (!user) {
    return res.status(409).json({
      success: false,
      message: "No Account Found",
    });
  }
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const { accessToken, refreshToken } = generateTokens({
        id: user.userId,
        role: user.role,
      });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
    });


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.NODE_ENV === "production",
     
    });

    const link = "https://insightconsulting.info/login"
    await sendEmail({ 
      eventName: "LOGIN_ALERT", 
      to: user.email, 
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
            A new login was detected. If this was you, no action is needed. 
          </p> 
          <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 24px;"> 
            Don't recognize this? Change your password right away to secure your account. 
          </p> 
    
          <!-- Warning box --> 
          <div style="background: #fff5f4; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #fcc;"> 
            <p style="margin: 0; font-size: 13px; color: #b33; line-height: 1.6;"> 
              If you didn't initiate this login, your account may be at risk. Act now. 
            </p> 
          </div> 
    
          <!-- Button --> 
          <a href="${link}" 
             style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;"> 
            Change password 
          </a> 
    
          <!-- Divider --> 
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" /> 
    
          <!-- Footer --> 
          <p style="margin: 0; color: #aaa; font-size: 12px; text-align: center;"> 
            This is a security notification sent for your safety. 
          </p> 
    
        </div> 
      </div> 
      ` 
    });

    return res.status(200).json({
      success: true,
      message: "Login successful", accessToken ,role:user.role,userId:user.userId});
  } catch {
    res.status(500).json({  
      success: false,
      message: "Internal server error"});
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return same response (security)
    if (!user) {
        return res.status(400).json({ message: "User Not Found" });
      }
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const resetLink = `https://insightconsultancy.netlify.app/user/reset-password?token=${token}`;


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

    res.json({ message: "If email exists, reset link sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: user.email },
      data: {
        password: hashed, // ⚠️ hash in production
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    await sendEmail({
        eventName: "PASSWORD_RESET_SUCCESS",
        to: user.email,
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
      
            <a href="https://insightconsultancy.netlify.app/login" 
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