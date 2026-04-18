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

    const accessToken = generateAccessToken({
      id: user.userId,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id:user.userId,
      role:user.role
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
      return res.json({ message: "User Not Found" });
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

    const resetLink = `http://localhost:5173/user/reset-password?token=${token}`;

    await sendEmail({
      eventName: "FORGOT_PASSWORD",
      to: email,   // ✅ THIS IS WHERE EMAIL GOES
      subject: "Reset Password",
      html: `<a href="${resetLink}">Click to reset password</a>`
    });

    console.log("USER RESET LINK:", resetLink);

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

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router