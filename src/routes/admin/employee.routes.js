  const express = require("express");
  const router = express.Router();
  const prisma = require("../../prisma/prisma");
  const {sendEmail} = require('../../email/emailService')
  const {profileUpload} = require("../../utils/multer")
  const {deleteS3Object} = require("../../utils/deleteS3Object")
  const crypto = require("crypto");


  const generateEmployeeCode = async () => {
    const count = await prisma.employee.count();
    const next = count + 1;
    return `EMP${String(next).padStart(4, "0")}`;
  };


/** ✅ Create Employee  **/
  router.post("/", profileUpload.single('photoUrl'), async (req, res) => {
    try {
 // ✅ Get image URL from S3
    const photoUrl = req.file?.location || null;
      const {
        name,
        email,
        mobileNumber,
        role,
        designation,
         departmentId
      } = req.body;


      const employeeCode = await generateEmployeeCode();
     
      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { departmentId }
      });
  
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found"
        });
      }
    

     // ✅ 1. Check if email already exists
     const existingEmployee = await prisma.employee.findUnique({
        where: { email }
      });
  
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }

   

      // 🔥 ALWAYS GENERATE TOKEN (LINK BASED SYSTEM)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hrs

    const finalPassword = crypto.randomBytes(4).toString("hex"); // ex: a1b2c3d4
  
  
      const employee = await prisma.employee.create({
        data: {
          name,
          email,
          mobileNumber,
          employeeCode,
          password:finalPassword,
          role,
          designation,
          status: "ACTIVE",
          photoUrl,
          departmentId,
          resetToken,
          resetTokenExpiry,
          isFirstLogin: true,
          inviteStatus: "PENDING",
        }
      });

    const resetLink = `http://localhost:5173/staff/reset-password?token=${resetToken}`;
       // ✅ SEND EMAIL (FOR BOTH CASES)
 

    const hrefWebsiteLink = "https://insightconsulting.info"
    const WebsiteLink = "www.insightconsulting.info"
    const companyName = "Insight Consulting"

    await sendEmail({
        eventName: "EMPLOYEE_FIRST_LOGIN_DETAILS",
        to: employee.email,
        subject: "Your account is ready — set your password",
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;">
          <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;">
            <div style="border-left: 3px solid #f13c20; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">Welcome to Insight Consulting</h2>
              <p style="margin: 0; font-size: 13px; color: #888;">Your account is ready</p>
            </div>
            <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
              Hi <strong>${name}</strong>, your account has been created. Use the details below to get started.
            </p>
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #eee;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="color: #aaa; padding: 5px 0; width: 40%;">Login email</td>
                  <td style="color: #111; padding: 5px 0; font-weight: 600;">${email}</td>
                </tr>
                <tr>
                  <td style="color: #aaa; padding: 5px 0;">Password</td>
                  <td style="color: #111; padding: 5px 0; font-weight: 600;">Set via link below</td>
                </tr>
              </table>
            </div>
            <div style="background: #fff5f4; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #fcc;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #b33; font-weight: 600;">Before you log in:</p>
              <p style="margin: 0; font-size: 13px; color: #b33; line-height: 1.7;">
                1. Click the button below to set your password.<br>
                2. Once done, you can log in with your email and new password.<br>
                3. This link expires in 24 hours.
              </p>
            </div>
            <a href="${resetLink}"
               style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
              Set your password
            </a>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" />
            <p style="margin: 0 0 6px; color: #aaa; font-size: 12px; text-align: center;">
              This is a security email from <strong style="color: #888;">${companyName}</strong>.
            </p>
            <p style="margin: 0; font-size: 12px; text-align: center;">
              <a href="${hrefWebsiteLink}" style="color: #f13c20; text-decoration: none;">${WebsiteLink}</a>
            </p>
          </div>
        </div>
        `,
      });

  
      res.status(201).json({
        success: true,
        message: "Employee Created & Invite Link Sent",
        data: employee
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /** ✅ Get All Employee  **/
  router.get("/", async (req, res) => {
    try {
      let { page, limit } = req.query;
  
      page = parseInt(page);
      limit = parseInt(limit);
  
      const skip = (page - 1) * limit;
  
      // Fetch employees with pagination
      const employees = await prisma.employee.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }, // optional
        select: {
          employeeId: true,
          name: true,
          email: true,
          mobileNumber: true,
          inviteStatus: true,
          role: true,
          designation: true,
          status: true,
          photoUrl: true,
          departmentId: true,
          createdAt: true,
        }
      });
  
      // Counts
      const totalEmployees = await prisma.employee.count();
      res.json({
        success: true,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalEmployees / limit),
        },
        data: employees,
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

  /** ✅ Get Employee By EmployeeId  **/
  // router.get("/employee/:employeeId", async (req, res) => {
  //   try {
  //     const { employeeId } = req.params;
  
  //     const employee = await prisma.employee.findUnique({
  //       where: { employeeId }
  //     });
  
  //     if (!employee) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Employee not found"
  //       });
  //     }
  
  //     res.json({ success: true, data: employee });
  
  //   } catch (error) {
  //     res.status(500).json({ success: false, error: error.message });
  //   }
  // });

  /** ✅ Update Employee By EmployeeId  **/
  router.put("/:employeeId",profileUpload.single('photoUrl'), async (req, res) => {
    try {
      const { employeeId } = req.params;
      const {
        name,
        email,
        mobileNumber,
        role,
        designation,
        status,
        departmentId
      } = req.body;


        // 1️⃣ Check employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
  
      // Optional: check department exists if departmentId is provided
      if (departmentId) {
        const department = await prisma.department.findUnique({ where: { departmentId } });
        if (!department) {
          return res.status(404).json({ success: false, message: "Department not found" });
        }
      }


      let photoUrl = existingEmployee.photoUrl;

      // 3️⃣ If new image uploaded
      if (req.file) {
        // delete old image
        if (existingEmployee.photoUrl) {
          await deleteS3Object(existingEmployee.photoUrl);
        }
  
        // save new image
        photoUrl = req.file.location;
      }


  
      const employee = await prisma.employee.update({
        where: { employeeId },
        data: { name, email, password: existingEmployee.password, mobileNumber, role, designation, status, photoUrl, departmentId }
      });

      // if (status === "INACTIVE") {
      //   await prisma.refreshToken.deleteMany({
      //     where: { employeeId }
      //   });
      // }
  
      res.json({
        success: true,
        message: "Employee updated successfully",
        data: employee
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

 /** ✅ Delete Employee By EmployeeId  **/
  router.delete("/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
   // 1️⃣ Check if employee exists
   const existingEmployee = await prisma.employee.findUnique({
    where: { employeeId }
  });

  if (!existingEmployee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found"
    });
  }

  // 2️⃣ Delete employee from DB
  await prisma.employee.delete({
    where: { employeeId }
  });

  // 3️⃣ Delete photo from S3 (if exists)
  if (existingEmployee.photoUrl) {
    await deleteS3Object(existingEmployee.photoUrl);
  }
      res.json({
        success: true,
        message: "Employee deleted successfully"
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });


  router.get("/stats", async (req, res) => {
    try {
      const totalDepartments = await prisma.department.count();
  
      const totalEmployees = await prisma.employee.count();
  
      const activeEmployees = await prisma.employee.count({
        where: { status: "ACTIVE" }   // change field if your column name is different
      });
  
      const inactiveEmployees = await prisma.employee.count({
        where: { status: "INACTIVE" }
      });
  
      res.json({
        success: true,
        data: {
          totalDepartments,
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
        },
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
  
  module.exports = router;