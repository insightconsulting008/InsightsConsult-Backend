const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
 
  // -----------------------------
  // CREATE SUBCATEGORY
  // POST /subcategory
  // -----------------------------
  router.post("/", async (req, res) => {
    try {
      const { subCategoryName, categoryId } = req.body;
  
      if (!subCategoryName || !categoryId) {
        return res.status(400).json({ success: false, message: "Subcategory Name and categoryId are required" });
      }
  
      const categoryExists = await prisma.category.findUnique({ where: { categoryId } });

      if (!categoryExists) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
  
      const subcategory = await prisma.subCategory.create({
        data: { subCategoryName, categoryId },
      });
  
      res.json({ success: true, subcategory });
    } catch (error) {
      console.error("Create Subcategory Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });


router.get("/", async (req, res) => {
      try {
        const subcategories = await prisma.subCategory.findMany();
    
        res.json({ success: true, subcategories });
      } catch (error) {
        console.error("Get Subcategories Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
      }
    });


  // -----------------------------
// UPDATE SUBCATEGORY (name only)
// PUT /subcategory/:subCategoryId
// -----------------------------
router.put("/:subCategoryId", async (req, res) => {
    try {
      const { subCategoryId } = req.params;
      const { subCategoryName } = req.body;
  
      if (!subCategoryName) {
        return res.status(400).json({
          success: false,
          message: "subCategoryName is required"
        });
      }
  
      const updatedSubcategory = await prisma.subCategory.update({
        where: { subCategoryId },
        data: { subCategoryName }
      });
  
      res.json({
        success: true,
        message: "Subcategory updated successfully",
        updatedSubcategory
      });
  
    } catch (error) {
      console.error("Update Subcategory Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });
  
  
  // -----------------------------
  // DELETE SUBCATEGORY
  // DELETE /subcategory/:subCategoryId
  // -----------------------------
  router.delete("/:subCategoryId", async (req, res) => {
    try {
      const { subCategoryId } = req.params;
  
      await prisma.subCategory.delete({
        where: { subCategoryId },
      });
  
      res.json({ success: true, message: "Subcategory deleted" });
    } catch (error) {
      console.error("Delete Subcategory Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });

  module.exports = router;