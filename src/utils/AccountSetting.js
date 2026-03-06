const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");
const { authenticate,authorizeRoles } = require("../authMiddleware/authMiddleware");
const {profileUpload,userProfileUpload} = require("../utils/multer")
const bcrypt = require("bcryptjs");
const { deleteS3Object } = require("../utils/deleteS3Object");



/* =================================
USER PROFILE
================================= */

router.get("/user/profile", authenticate,authorizeRoles("USER"), async (req, res) => {

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


router.post("/complete-profile",authenticate,authorizeRoles("USER"),async (req, res) => {
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

router.put("/user/change-password",authenticate,authorizeRoles("USER"),async (req, res) => {
      try {
        const { oldPassword, newPassword } = req.body;
  
        if (!oldPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            message: "Old password and new password are required",
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

/* =================================
STAFF PROFILE
================================= */

router.get("/staff/profile", authenticate, authorizeRoles("STAFF","ADMIN"), async (req, res) => {

  try {

    const emp = await prisma.employee.findUnique({
      where: { employeeId: req.user.id },
      select: {
        photoUrl:true,
        name: true,
        email: true,
        mobileNumber: true,
        designation: true,
        role: true,
        employeeCode: true,   // ✅ Employee Code
        status: true,         // ✅ Employee Status
        department: {         // ✅ Department Relation
            select: {
              name: true,
              departmentCode: true
            }
          }
      }
    });

    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      data: emp
    });

  } catch (error) {

    console.error("Employee profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employee profile"
    });

  }

});



/* ============================
CHANGE STAFF / ADMIN PASSWORD
============================ */

router.put("/staff/change-password",authenticate,authorizeRoles("STAFF", "ADMIN"),async (req, res) => {
      try {
        const { oldPassword, newPassword } = req.body;
  
        if (!oldPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            message: "Old password and new password are required",
          });
        }
  
        const staff = await prisma.employee.findUnique({
          where: { employeeId: req.user.id },
        });
  
        if (!staff) {
          return res.status(404).json({
            success: false,
            message: "Staff not found",
          });
        }
  
        // direct password comparison
        if (oldPassword !== staff.password) {
          return res.status(400).json({
            success: false,
            message: "Old password incorrect",
          });
        }

        if (newPassword === staff.password) {
            return res.status(400).json({
              message: "New password cannot be same as old password",
            });
          }
  
        // update password directly
        await prisma.employee.update({
          where: { employeeId: req.user.id },
          data: {
            password: newPassword,
          },
        });
  
        res.json({
          success: true,
          message: "Password updated successfully",
        });
  
      } catch (error) {
        console.error("Staff change password error:", error);
  
        res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    }
  );


router.put("/staff/update-photo",authenticate,authorizeRoles("STAFF", "ADMIN"),profileUpload.single('photoUrl'),
    async (req, res) => {
      try {
        const newPhoto = req.file?.location ;
  
        if (!newPhoto) {
          return res.status(400).json({
            success: false,
            message: "Photo required",
          });
        }
  
        const employee = await prisma.employee.findUnique({
            where: { employeeId: req.user.id }
          });

           // Delete old photo
      if (employee?.photoUrl) {
        await deleteS3Object(employee.photoUrl);
      }

        const staff = await prisma.employee.update({
          where: { employeeId: req.user.id },
          data: {
            photoUrl: newPhoto,
          },
        });
  
        return res.json({
          success: true,
          message: "Profile photo updated",
          data: staff,
        });
      } catch (error) {
        console.error("Staff photo update error:", error);
  
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }
    }
  );


  
router.put("/user/update-photo",authenticate,authorizeRoles("USER"),userProfileUpload.single('photoUrl'),
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

       // Delete old photo
  if (user?.photoUrl) {
    await deleteS3Object(user.photoUrl);
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