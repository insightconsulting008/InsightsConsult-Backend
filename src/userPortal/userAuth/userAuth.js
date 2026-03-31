const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../../utils/config")
const{ authenticate,authorizeRoles } = require("../../authMiddleware/authMiddleware")
const {sendEmail} = require("../../email/emailService")


/* =====================================================
   TOKEN HELPERS
===================================================== */

const generateAccessToken = (payload) =>
  jwt.sign(payload, config.ACCESS_SECRET, { expiresIn: "1d" });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, config.REFRESH_SECRET, { expiresIn: "7d" });



/* =====================================================
   USER REGISTER
===================================================== */

router.post("/user/register", async (req, res) => {
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
    where: { campaign: utmCampaign },
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
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        refCode: refCode || null,
        // ✅ relation
        utmCampaignId: utmCampaignId || null,},
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

router.post("/user/login", async (req, res) => {
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
    return res.status(402).json({
      success: false,
      message: "No Account Found",
    });
  }
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(402).json({
        success: false,
        message: "Invalid email or password"
      });
    }

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

    return res.status(200).json({
      success: true,
      message: "Login successful", accessToken ,role:user.role,userId:user.userId});
  } catch {
    res.status(500).json({  
      success: false,
      message: "Internal server error"});
  }
});

router.post("/user/forgot-password", async (req, res) => {
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


router.post("/user/reset-password", async (req, res) => {
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
/* =====================================================
   STAFF LOGIN
===================================================== */

router.post("/staff/login", async (req, res) => {
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


    const accessToken = generateAccessToken({
      id: emp.employeeId,
      role: emp.role,
    });

    const refreshToken = generateRefreshToken({
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

    return res.status(200).json({
      message: "Login successful", accessToken ,role:emp.role, employeeId :emp.employeeId});
  } catch {
    res.status(500).json({ success: false,
      message: "Internal server error" });
  }
});

router.post("/staff/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email)

    const employee = await prisma.employee.findUnique({ where: { email } });
    console.log(employee)

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

    const resetLink = `http://localhost:5173/staff/reset-password?token=${token}`;

    await sendEmail({
      eventName: "FORGOT_PASSWORD",
      to: email,   // ✅ THIS IS WHERE EMAIL GOES
      subject: "Reset Password",
      html: `<a href="${resetLink}">Click to reset password</a>`
    });

    console.log("EMPLOYEE RESET LINK:", resetLink);

    res.json({ message: "If email exists, reset link sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/staff/reset-password", async (req, res) => {
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

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   COMMON REFRESH API
===================================================== */

router.post("/auth/refresh", async (req, res) => {
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
    const newAccessToken = generateAccessToken(payload);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

/* =====================================================
   LOGOUT
===================================================== */

router.post("/auth/logout", async (req, res) => {
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


router.post("/auth/logout-all", async (req, res) => {
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









