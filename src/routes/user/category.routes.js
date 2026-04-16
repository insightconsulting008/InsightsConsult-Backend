const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");


  // -----------------------------
  // GET ALL CATEGORIES
  // GET /category
  // -----------------------------
  router.get("/", async (req, res) => {
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
  router.get("/:categoryId", async (req, res) => {
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


  module.exports = router;  