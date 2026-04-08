
const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");
const { authenticate,authorizeRoles } = require("../authMiddleware/authMiddleware");
const {profileUpload,} = require("../utils/multer")
const { deleteS3Object } = require("../utils/deleteS3Object");

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
  


module.exports = router;