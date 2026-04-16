  const express = require("express");
  const router = express.Router();
  const prisma = require("../../prisma/prisma");

  

/** ✅ Create Department  **/
router.post("/", async (req, res) => {
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
  

/** ✅ Get All Departments with Pagination */
router.get("/", async (req, res) => {
    try {
      let { page, limit } = req.query;
  
      page = parseInt(page);
      limit = parseInt(limit);
  
      const skip = (page - 1) * limit;
  
      const departments = await prisma.department.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }  // Optional
      });
  
      const totalDepartments = await prisma.department.count();
  
      res.json({
        success: true,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalDepartments / limit),
        },
        data: departments,
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

/** ✅ Get Department by ID **/
router.get("/:departmentId", async (req, res) => {
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
router.put("/:departmentId", async (req, res) => {
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
router.delete("/:departmentId", async (req, res) => {
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

   // Prisma Foreign Key error code is P2003
   if (error.code === "P2003") {
     return res.status(400).json({
      success: false,
      message:
        "You cannot delete this department because employees are still assigned to it.",
    });
  }
   return res.status(500).json({ success: false, error: error.message });
    }
  });


  module.exports = router;