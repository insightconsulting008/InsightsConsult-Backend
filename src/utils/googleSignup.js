
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
              <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">Someone logged into your account</h2> 
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
              This is a security email from <strong style="color: #888;">Insight Consulting</strong>. 
            </p> 
            <p style="margin: 0; font-size: 12px; text-align: center;"> 
              <a href="https://insightconsulting.info" style="color: #f13c20; text-decoration: none;">insightconsulting.info</a> 
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