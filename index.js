const express = require("express");
const cors = require("cors");
const app = express();
const prisma = require('./src/prisma/prisma')

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors());
app.use(express.json());

/* -------------------- ROUTES -------------------- */
app.get("/test", (req, res) => {
  res.json({
    message: "Insight Consulting Project Server is running 🚀"
  });
});


/* -------------------- ROUTES -------------------- */


/* =====================================================
   DEPARTMENT APIs
===================================================== */

/** ✅ Create Department  **/
app.post("/department", async (req, res) => {
    try {
      const { name, departmentCode, labelColor } = req.body;
  
      const department = await prisma.department.create({
        data: {
          name,
          departmentCode,
          labelColor
        }
      });
  
      res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: department
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
/** ✅ Get All Departments **/
app.get("/department", async (req, res) => {
    try {
      const departments = await prisma.department.findMany();
      res.json({ success: true, data: departments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

/** ✅ Get Department by ID **/
app.get("/department/:departmentId", async (req, res) => {
    try {
      const { departmentId } = req.params;
  
      const department = await prisma.department.findUnique({
        where: { departmentId }
      });
  
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found"
        });
      }
  
      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

/** ✅ Update Department **/
app.put("/department/:departmentId", async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { name, departmentCode, labelColor } = req.body;
  
      const department = await prisma.department.update({
        where: { departmentId },
        data: { name, departmentCode, labelColor }
      });
  
      res.json({
        success: true,
        message: "Department updated successfully",
        data: department
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
/** ✅ Delete Department by ID **/
app.delete("/department/:departmentId", async (req, res) => {
    try {
      const { departmentId } = req.params;
  
      await prisma.department.delete({
        where: { departmentId }
      });
  
      res.json({
        success: true,
        message: "Department deleted successfully"
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
/* =====================================================
   EMPLOYEE APIs
===================================================== */

/** ✅ Create Employee  **/
  app.post("/employee", async (req, res) => {
    try {
      const {
        name,
        email,
        mobileNumber,
        role,
        designation,
        photoUrl,
        departmentId
      } = req.body;
  
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
  
      const employee = await prisma.employee.create({
        data: {
          name,
          email,
          mobileNumber,
          role,
          designation,
          status: "ACTIVE",
          photoUrl,
          departmentId
        }
      });
  
      res.status(201).json({
        success: true,
        message: "Employee created successfully",
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
  app.get("/employee", async (req, res) => {
    try {
      const employees = await prisma.employee.findMany();
  
      res.json({ success: true, data: employees });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

    /** ✅ Get Employee By EmployeeId  **/
  app.get("/employee/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
  
      const employee = await prisma.employee.findUnique({
        where: { employeeId }
      });
  
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found"
        });
      }
  
      res.json({ success: true, data: employee });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** ✅ Update Employee By EmployeeId  **/
  app.put("/employee/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
      const {
        name,
        email,
        mobileNumber,
        role,
        designation,
        status,
        photoUrl,
        departmentId
      } = req.body;
  
      // Optional: check department exists if departmentId is provided
      if (departmentId) {
        const department = await prisma.department.findUnique({ where: { departmentId } });
        if (!department) {
          return res.status(404).json({ success: false, message: "Department not found" });
        }
      }
  
      const employee = await prisma.employee.update({
        where: { employeeId },
        data: { name, email, mobileNumber, role, designation, status, photoUrl, departmentId }
      });
  
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
  app.delete("/employee/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
  
      await prisma.employee.delete({
        where: { employeeId }
      });
  
      res.json({
        success: true,
        message: "Employee deleted successfully"
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
  
  
  

  
 



/* -------------------- SERVER -------------------- */
app.listen(6001, () => {
  console.log(`✅ Insight Consulting Project Server running on port 6001`);
});
