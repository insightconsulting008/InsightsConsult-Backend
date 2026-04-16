const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../../utils/config")
const generateTokens = require("../../utils/tokenHelper")
/* =====================================================
   COMMON REFRESH API
===================================================== */

router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
    });
 

    // ❌ invalid or expired
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(403).json({ message: "Invalid token" });
    }

    let payload;

    // ✅ USER
    if (stored.userId) {
      const user = await prisma.user.findUnique({
        where: { userId: stored.userId },
      });
 

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      payload = {
        id: user.userId,
        role: user.role,
      };
    }

    // ✅ EMPLOYEE
    else {
      const emp = await prisma.employee.findUnique({
        where: { employeeId: stored.employeeId },
      });

      if (!emp) {
        return res.status(404).json({ message: "Employee not found" });
      }

      payload = {
        id: emp.employeeId,
        role: emp.role,
      };
    }

    // ===============================
    // 🔐 NEW ACCESS TOKEN
    // ===============================
   // 🔐 Generate new access token
   const { accessToken: newAccessToken } = generateTokens(payload);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});
/* =====================================================
   LOGOUT
===================================================== */
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      await prisma.refreshToken.delete({
        where: { token }, // 🔥 only this device
      });
    }

    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Logged out from this device",
    });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});


router.post("/logout-all", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(token, config.REFRESH_SECRET);


    if (decoded.role === "USER") {
      await prisma.refreshToken.deleteMany({
        where: { userId: decoded.id },
      });
    } else {
      await prisma.refreshToken.deleteMany({
        where: { employeeId: decoded.id },
      });
    }

    res.clearCookie("refreshToken");

    res.json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});


module.exports = router









