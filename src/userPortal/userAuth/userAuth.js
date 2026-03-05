const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../utils/config")
const{ authenticate,authorizeRoles } = require("../../authMiddleware/authMiddleware")


/* =====================================================
   TOKEN HELPERS
===================================================== */

const generateAccessToken = (payload) =>
  jwt.sign(payload, config.ACCESS_SECRET, { expiresIn: "15min" });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, config.REFRESH_SECRET, { expiresIn: "7d" });



/* =====================================================
   USER REGISTER
===================================================== */

router.post("/user/register", async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
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
      data: { name, email, phoneNumber, password: hashed },
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
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




// router.get(
//   "/user/dashboard",
//   authenticate,
//   authorizeRoles(["USER"]),
//   async (req, res) => {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { userId: req.user.id },
//         select: {
//           userId: true,
//           name: true,
//           email: true,
//           phoneNumber: true,
//           role: true,
//         },
//       });

//       res.json({
//         success: true,
//         data: user,
//       });
//     } catch (err) {
//       res.status(500).json({ message: "Error fetching user dashboard" });
//     }
//   }
// );

// router.get(
//   "/employee/dashboard",
//   authenticate,
//   authorizeRoles(["STAFF","ADMIN"]),
//   async (req, res) => {
//     try {
//       const staff = await prisma.employee.findUnique({
//         where: { employeeId: req.user.id },
//         select: {
//           employeeId: true,
//           name: true,
//           email: true,
//           role: true,
//           mobileNumber:true
//         },
//       });

//       res.json({
//         success: true,
//         data: staff,
//       });
//     } catch (err) {
//       res.status(500).json({ message: "Error fetching staff dashboard" });
//     }
//   }
// );




module.exports = router









