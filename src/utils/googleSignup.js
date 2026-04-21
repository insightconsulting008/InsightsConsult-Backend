
const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma")
const googleClient = require("../utils/googleClient");
const jwt = require("jsonwebtoken");
const config = require("../utils/config")
const generateTokens = require("../utils/tokenHelper")
const {sendEmail} = require("../../src/email/emailService")



router.post("/google-auth", async (req, res) => {
  try {
    const { token,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      refCode } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Google token required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { sub, email, name, picture } = payload;

    let utmCampaignId = null;

    if (utmCampaign) {
      const campaignData = await prisma.utmCampaign.findUnique({
        where: { campaignName: utmCampaign }, // ✅ FIXED
        select: { utmCampaignId: true },
      });

      utmCampaignId = campaignData?.utmCampaignId || null;
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Signup if user does not exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          photoUrl: picture,
          provider: "GOOGLE",
          providerId: sub,
         // 🔥 UTM snapshot
         utmSource: utmSource || null,
         utmMedium: utmMedium || null,
         utmCampaignName: utmCampaign || null, // ✅ FIXED
         utmContent: utmContent || null,
         utmTerm: utmTerm || null,
         refCode: refCode || null,

         // 🔗 Relation
         utmCampaignId: utmCampaignId || null,
        },
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user.userId,
      role: user.role,
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });



    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
 const link = "https://insightconsultancy.netlify.app/login"
    await sendEmail({
      eventName: "LOGIN_ALERT",
      to: user.email,
      subject: "New Login to Your Account",


      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#f9fafb; padding:20px 10px;">
        
        <div style="max-width:480px; margin:auto; background:#ffffff; border-radius:8px; padding:30px; border:1px solid #eee;">
    
          <!-- Title -->
          <h2 style="margin:0 0 10px; color:#111; font-weight:600;">
           New Login Detected
          </h2>
    
          <!-- Message -->
          <p style="color:#555; font-size:14px; line-height:1.6;">
           Your account was accessed successfully. If this was you, no further action is needed.
          </p>
    
          <!-- Button -->
          <div style="margin:25px 0; text-align:center;">
            <a href="${link}" 
               style="background:#f13c20; color:#fff; padding:10px 20px; text-decoration:none; border-radius:6px; font-size:14px; display:inline-block;">
              Secure Account
            </a>
          </div>
    
          <!-- Divider -->
          <hr style="border:none; border-top:1px solid #eee; margin:25px 0;" />
    
          <!-- Footer -->
          <p style="color:#aaa; font-size:12px; text-align:center;">
           This is a security notification to help keep your account safe.
          </p>
    
        </div>
      </div>
      `
    });

  
    res.json({
      success: true,
      message: "Google authentication successful",
      role:user.role,
      accessToken,
      userId: user.userId,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
});

module.exports = router;