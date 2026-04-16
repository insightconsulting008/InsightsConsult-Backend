 const express = require("express");
 const router = express.Router();
 const prisma = require("../../prisma/prisma");
 const config = require("../../../src/utils/config")


router.post("/admin", async (req, res) => {
    try {
      const { name, email, password, mobileNumber, profilePassword, setupKey } = req.body;
  
      // 🔐 Check setup key
      if (setupKey !== config.SETUP_SECRET) {
        return res.status(400).json({
          success: false,
          message: "Unauthorized setup access",
        });
      }
  
      // 🔒 Check if admin already exists
      const existingAdmin = await prisma.employee.findFirst({
        where: { role: "ADMIN" },
      });
  
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Admin already created. Setup locked.",
        });
      }
  
      const employeeCode = await generateEmployeeCode();
  
      const admin = await prisma.employee.create({
        data: {
          name,
          email,
          password,
          mobileNumber,
          employeeCode,
          profilePassword,
          role: "ADMIN",
          designation: "Owner",
          status: "ACTIVE",
          departmentId: null,
          isFirstLogin: false,
          inviteStatus: "ACCEPTED",
        },
      });
  
      res.status(201).json({
        success: true,
        message: "Admin created successfully",
        data: admin,
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  module.exports = router