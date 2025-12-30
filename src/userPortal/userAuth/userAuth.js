const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../utils/config")
const{ authenticate,authorizeRoles } = require("../../authMiddleware/authMiddleware")




/* ======================
   TOKEN HELPERS
====================== */
const generateAccessToken = (user) => {
    return jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      config.ACCESS_SECRET,
      { expiresIn: "30s" }
    );
  };
  
  const generateRefreshToken = (user) => {
    return jwt.sign(
      { userId: user.id },
      config.REFRESH_SECRET,
      { expiresIn: "60s" }
    );
  };




/* ======================
   REGISTER
====================== */
router.post("/auth/register", async (req, res) => {
    try {
      const {name, phoneNumber, email, password, role } = req.body;
  
      if (!email || !password || !role || !phoneNumber || !name) {
        return res.status(400).json({
          success: false,
          message: "Email, password and role are required"
        });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phoneNumber,
          password: hashedPassword,
          role
        }
      });
  
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          userId: user.userId,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  
  router.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required"
        });
      }
  
      const user = await prisma.user.findUnique({
        where: { email }
      });
      console.log(user)
  
      if (!user) {
        return res.status(401).json({
          success: false,
        message: "Invalid email or password"
        });
      }
  
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid password"
        });
      }
  
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
  
      await prisma.user.update({
        where: { userId: user.userId },
        data: { refreshToken }
      });
  
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      console.log("Cookies received:", req.cookies);
  
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          accessToken,
          userId: user.userId,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  



  router.get(
    "/auth/dashboard/staff",
    authenticate,authorizeRoles(["USER", "STAFF","ADMIN"]),
    async (req, res) => {
      try {
        return res.status(200).json({
          success: true,
          message: "Staff dashboard loaded",
          data: {
            assignedTasks: 12,
            completedTasks: 7,
            pendingReviews: 2
          }
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Internal server error"
        });
      }
    }
  );


/* ======================
   REFRESH TOKEN (⭐ ADDED)
====================== */
router.post("/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
  
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Refresh token missing"
        });
      }
  
      const user = await prisma.user.findFirst({
        where: { refreshToken }
      });
  
      if (!user) {
        return res.status(403).json({
          success: false,
          message: "Invalid refresh token"
        });
      }
  
      jwt.verify(refreshToken, config.REFRESH_SECRET, (err) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: "Refresh token expired"
          });
        }
  
        const newAccessToken = generateAccessToken(user);
  
        return res.status(200).json({
          success: true,
          message: "Access token refreshed",
          data: { accessToken: newAccessToken }
        });
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  


/* ======================
   LOGOUT
====================== */
router.post("/auth/logout", async (req, res) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
  
      if (refreshToken) {
        await prisma.user.updateMany({
          where: { refreshToken },
          data: { refreshToken: null }
        });
      }
  
      res.clearCookie("refreshToken");
  
      return res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  

module.exports = router