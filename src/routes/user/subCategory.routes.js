  const express = require("express");
  const router = express.Router();
  const prisma = require("../../prisma/prisma");
  
  
  // -----------------------------
  // GET ALL SUBCATEGORIES
  // GET /subcategory
  // -----------------------------
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
  // GET SUBCATEGORY BY ID
  // GET /subcategory/:subCategoryId
  // -----------------------------
  router.get("/:subCategoryId", async (req, res) => {
    try {
      const { subCategoryId } = req.params;
  
      const subcategory = await prisma.subCategory.findUnique({
        where: { subCategoryId }
      });
  
      if (!subcategory) return res.status(404).json({ success: false, message: "Subcategory not found" });
  
      res.json({ success: true, subcategory });
    } catch (error) {
      console.error("Get Subcategory Error:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });


  
module.exports = router;  