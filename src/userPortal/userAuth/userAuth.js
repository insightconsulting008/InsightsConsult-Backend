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
  jwt.sign(payload, config.ACCESS_SECRET, { expiresIn: "15m" });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, config.REFRESH_SECRET, { expiresIn: "7d" });



/* =====================================================
   USER REGISTER
===================================================== */

router.post("/user/register", async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, phoneNumber, password: hashed },
    });

    res.json({ success: true, userId: user.userId });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});



/* =====================================================
   USER LOGIN
===================================================== */

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

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
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch {
    res.status(500).json({ message: "Error" });
  }
});

/* =====================================================
   STAFF LOGIN
===================================================== */

router.post("/staff/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const emp = await prisma.employee.findUnique({ where: { email } });
    if (!emp) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, emp.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

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
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch {
    res.status(500).json({ message: "Error" });
  }
});

/* =====================================================
   COMMON REFRESH API
===================================================== */

router.post("/auth/refresh", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No token" });

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

      if (!user) return res.status(404).json({ message: "User not found" });

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

      if (!emp) return res.status(404).json({ message: "Employee not found" });

      payload = {
        id: emp.employeeId,
        role: emp.role,
      };
    }

    // ===============================
    // 🚀 SLIDING SESSION (KEY PART)
    // ===============================
    await prisma.refreshToken.update({
      where: { token },
      data: {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 ),//30 days extend
      },
    });

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













//   router.post("/auth/login", async (req, res) => {
//     try {
//       const { email, password } = req.body;
  
//       if (!email || !password) {
//         return res.status(400).json({
//           success: false,
//           message: "Email and password are required"
//         });
//       }
  
//       const user = await prisma.user.findUnique({
//         where: { email }
//       });
//       console.log(user)
  
//       if (!user) {
//         return res.status(401).json({
//           success: false,
//         message: "Invalid email or password"
//         });
//       }
  
//       const isValid = await bcrypt.compare(password, user.password);
//       if (!isValid) {
//         return res.status(401).json({
//           success: false,
//           message: "Invalid password"
//         });
//       }
  
//       const accessToken = generateAccessToken(user);
//       const refreshToken = generateRefreshToken(user);
  
//       await prisma.user.update({
//         where: { userId: user.userId },
//         data: { refreshToken }
//       });
  
//       res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: true, 
//         sameSite: "none",
//         maxAge: 30 * 24 * 60 * 60 * 1000
//       });

//       console.log("Cookies received:", req.cookies);
  
//       return res.status(200).json({
//         success: true,
//         message: "Login successful",
//         data: {
//           accessToken,
//           userId: user.userId,
//           role: user.role
//         }
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: "Internal server error"
//       });
//     }
//   });
  



//   router.get("/auth/dashboard/staff",
//     authenticate,authorizeRoles(["USER", "STAFF","ADMIN"]),
//     async (req, res) => {
//       try {
//         return res.status(200).json({
//           success: true,
//           message: "Staff dashboard loaded",
//           data: {
//             assignedTasks: 12,
//             completedTasks: 7,
//             pendingReviews: 2
//           }
//         });
//       } catch (error) {
//         return res.status(500).json({
//           success: false,
//           message: "Internal server error"
//         });
//       }
//     }
//   );


// /* ======================
//    REFRESH TOKEN (⭐ ADDED)
// ====================== */
// router.post("/auth/refresh", async (req, res) => {
//     try {
//       const refreshToken = req.cookies.refreshToken;
  
//       if (!refreshToken) {
//         return res.status(401).json({
//           success: false,
//           message: "Refresh token missing"
//         });
//       }
  
//       const user = await prisma.user.findFirst({
//         where: { refreshToken }
//       });
  
//       if (!user) {
//         return res.status(403).json({
//           success: false,
//           message: "Invalid refresh token"
//         });
//       }
  
//       jwt.verify(refreshToken, config.REFRESH_SECRET, (err) => {
//         if (err) {
//           return res.status(403).json({
//             success: false,
//             message: "Refresh token expired"
//           });
//         }
  
//         const newAccessToken = generateAccessToken(user);
  
//         return res.status(200).json({
//           success: true,
//           message: "Access token refreshed",
//           data: { accessToken: newAccessToken }
//         });
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: "Internal server error"
//       });
//     }
//   });
  


// /* ======================
//    LOGOUT
// ====================== */
// router.post("/auth/logout", async (req, res) => {
//     try {
//       const refreshToken = req.cookies?.refreshToken;
  
//       if (refreshToken) {
//         await prisma.user.updateMany({
//           where: { refreshToken },
//           data: { refreshToken: null }
//         });
//       }
  
//       res.clearCookie("refreshToken");
  
//       return res.status(200).json({
//         success: true,
//         message: "Logged out successfully"
//       });
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         message: "Internal server error"
//       });
//     }
//   });

  

