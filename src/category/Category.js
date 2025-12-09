const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");

// -----------------------------
// CREATE CATEGORY
// POST /category
// -----------------------------
router.post("/category", async (req, res) => {
    try {
      const { categoryName } = req.body;
      if (!categoryName) return res.status(400).json({ success: false, message: "CategoryName is required" });
  
      const category = await prisma.category.create({
        data: { categoryName },
      });
  
      res.json({ success: true, category });
    } catch (error) {
      console.error("Create Category Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });


// -----------------------------
// UPDATE CATEGORY
// PUT /category/:categoryId
// -----------------------------
router.put("/category/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { categoryName } = req.body;
  
      if (!categoryName) {
        return res.status(400).json({ success: false, message: "CategoryName is required" });
      }
  
      const category = await prisma.category.update({
        where: { categoryId },
        data: { categoryName },
      });
  
      res.json({ success: true, message: "Category updated", category });
    } catch (error) {
      console.error("Update Category Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });
  
  
  
  // -----------------------------
  // GET ALL CATEGORIES
  // GET /category
  // -----------------------------
 router.get("/category", async (req, res) => {
    try {
      const categories = await prisma.category.findMany();
      res.json({ success: true, categories });
    } catch (error) {
      console.error("Get Categories Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });
  
  
  // -----------------------------
  // GET SINGLE CATEGORY
  // GET /category/:categoryId
  // -----------------------------
  router.get("/category/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
  
      const category = await prisma.category.findUnique({
        where: { categoryId }
      });
  
      if (!category) return res.status(404).json({ success: false, message: "Category not found" });
  
      res.json({ success: true, category });
    } catch (error) {
      console.error("Get Category Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });
  
  
  // -----------------------------
  // DELETE CATEGORY
  // DELETE /category/:categoryId
  // -----------------------------
  router.delete("/category/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
  
      await prisma.category.delete({
        where: { categoryId },
      });
  
      res.json({ success: true, message: "Category deleted" });
    } catch (error) {
      console.error("Delete Category Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });
  
  
  module.exports = router;
  