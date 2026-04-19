const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const {userProfileUpload} = require("../../utils/multer")
const bcrypt = require("bcryptjs");
const { deleteS3Object } = require("../../utils/deleteS3Object");


//authenticate,authorizeRoles("USER"),
/* =================================
USER PROFILE
================================= */

router.get("/profile",  async (req, res) => {

  try {

    const user = await prisma.user.findUnique({
      where: { userId: req.user.id },
      select: {
        name: true,
        email: true,
        photoUrl:true,
        phoneNumber: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {

    console.error("User profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile"
    });

  }

});

router.post("/complete-profile",async (req, res) => {
      try {
        const { phoneNumber } = req.body;
  
        // userId from JWT middleware
        const userId = req.user.id;
  
        // validation
        if (!phoneNumber) {
          return res.status(400).json({
            success: false,
            message: "Phone number is required",
          });
        }
  
        // optional: basic phone validation
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(phoneNumber)) {
          return res.status(400).json({
            success: false,
            message: "Invalid phone number format",
          });
        }
  
        const user = await prisma.user.update({
          where: { userId: userId },
          data: { phoneNumber },
          select: {
            userId: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        });
  
        return res.status(200).json({
          success: true,
          message: "Phone number added successfully",
          data: user,
        });
      } catch (error) {
  
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );
/* ============================
CHANGE USER PASSWORD
============================ */

router.put("/change-password",async (req, res) => {
      try {
        const { oldPassword, newPassword } = req.body;
  
        if (!newPassword) {
            return res.status(400).json({
              success: false,
              message: "New password is required",
            });
          }
        const user = await prisma.user.findUnique({
          where: { userId: req.user.id },
        });


  
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

         // ✅ GOOGLE USER (no password yet)
    if (user.provider === "GOOGLE" && !user.password) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
  
        await prisma.user.update({
          where: { userId: req.user.id },
          data: { password: hashedPassword },
        });
  
        return res.json({
          success: true,
          message: "Password set successfully",
        });
      }

      // ✅ NORMAL USER → must provide old password
    if (!oldPassword) {
        return res.status(400).json({
          success: false,
          message: "Old password is required",
        });
      }
  
        const valid = await bcrypt.compare(oldPassword, user.password);
  
        if (!valid) {
          return res.status(400).json({
            success: false,
            message: "Password incorrect",
          });
        }
  
        const hashedPassword = await bcrypt.hash(newPassword, 10);
  
        await prisma.user.update({
          where: { userId: req.user.id },
          data: { password: hashedPassword },
        });
  
        return res.json({
          success: true,
          message: "Password updated successfully",
        });
      } catch (error) {
        console.error("User password change error:", error);
  
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    }
  );

router.put("/update-photo",userProfileUpload.single('photoUrl'),
async (req, res) => {
  try {
    const newPhoto = req.file?.location ;

    if (!newPhoto) {
      return res.status(400).json({
        success: false,
        message: "Photo required",
      });
    }

    const user = await prisma.user.findUnique({
        where: { userId: req.user.id }
      });

  // ✅ SAFE DELETE (only if S3 URL)
  if (user.photoUrl && user.photoUrl.includes("amazonaws.com")) {
    try {
      await deleteS3Object(user.photoUrl);
    } catch (err) {
      console.log("⚠️ S3 delete skipped:", err.message);
    }
  }
    const userUpdate = await prisma.user.update({
      where: { userId: req.user.id },
      data: {
        photoUrl: newPhoto,
      },
    });

    return res.json({
      success: true,
      message: "Profile photo updated",
      data: userUpdate,
    });
  } catch (error) {
    console.error("User photo update error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}
);

module.exports = router;