const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma")
const googleClient = require("../utils/googleClient");
const jwt = require("jsonwebtoken");
const config = require("../utils/config")

/* =====================================================
   TOKEN HELPERS
===================================================== */

const generateAccessToken = (payload) =>
    jwt.sign(payload, config.ACCESS_SECRET, { expiresIn: "15min" });
  
  const generateRefreshToken = (payload) =>
    jwt.sign(payload, config.REFRESH_SECRET, { expiresIn: "7d" });
  
  



router.post("/user/google-auth", async (req, res) => {
  try {
    const { token } = req.body;

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
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.userId,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
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

    res.json({
      success: true,
      message: "Google authentication successful",
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