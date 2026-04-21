
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
    // await sendEmail({
    //   eventName: "LOGIN_ALERT",
    //   to: user.email,
    //   subject: "New Login to Your Account",
    //   html: `
    //   <div style="margin:0;padding:0;background:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        
    //     <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;padding:40px 32px;border:1px solid #eaeaea;">
          
    //       <!-- Brand -->
    //       <div style="text-align:center;margin-bottom:30px;">
    //         <span style="font-size:18px;font-weight:600;color:#111;letter-spacing:0.5px;">
    //           Insight Consulting
    //         </span>
    //       </div>
    
    //       <!-- Title -->
    //       <h2 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#111;text-align:center;">
    //         New Login Detected
    //       </h2>
    
    //       <!-- Message -->
    //       <p style="margin:0 0 10px;color:#444;font-size:14px;line-height:1.7;text-align:center;">
    //         Your account was accessed successfully.
    //       </p>
    
    //       <p style="margin:0 0 25px;color:#666;font-size:14px;line-height:1.7;text-align:center;">
    //         If this was you, no further action is needed.
    //       </p>
    
    //       <!-- Soft Alert Box -->
    //       <div style="background:#fff5f5;border:1px solid #ffe3e3;border-radius:8px;padding:14px;text-align:center;margin-bottom:25px;">
    //         <span style="color:#c92a2a;font-size:13px;">
    //           If this wasn’t you, we recommend securing your account immediately.
    //         </span>
    //       </div>
    
    //       <!-- Button -->
    //       <div style="text-align:center;margin-bottom:30px;">
    //         <a href="${securityLink}" 
    //            style="background:#111;color:#ffffff;padding:12px 26px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;display:inline-block;">
    //           Secure Account
    //         </a>
    //       </div>
    
    //       <!-- Divider -->
    //       <div style="height:1px;background:#eee;margin:25px 0;"></div>
    
    //       <!-- Footer -->
    //       <p style="margin:0;color:#999;font-size:12px;text-align:center;line-height:1.6;">
    //         This is a security notification to help keep your account safe.<br/>
    //         If you need assistance, please contact Insight Consulting support.
    //       </p>
    
    //     </div>
    
    //   </div>
    //   `
    // });

  
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