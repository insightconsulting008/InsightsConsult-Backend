const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");


/*
=====================================
1️⃣ GET ALL CATEGORIES
=====================================
*/
router.get("/api/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        categoryId: true,
        categoryName: true,
      },
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
});

/*
=====================================
2️⃣ GET SUBCATEGORIES BY CATEGORY
=====================================
*/
router.get("/api/categories/:categoryId/subcategories", async (req, res) => {
  try {
    const { categoryId } = req.params;

    const subcategories = await prisma.subCategory.findMany({
      where: { categoryId },
      select: {
        subCategoryId: true,
        subCategoryName: true,
      },
    });

    res.json({ success: true, data: subcategories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch subcategories" });
  }
});

/*
=====================================
3️⃣ GET SERVICES BY SUBCATEGORY
   - Pagination
   - Search
=====================================
*/
router.get("/api/subcategories/:subCategoryId/services", async (req, res) => {
  try {
    const { subCategoryId } = req.params;
    const { page = 1, limit = 6, search = "" } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const whereCondition = {
      subCategoryId,
      name: {
        contains: search,
        mode: "insensitive",
      },
    };

    const totalServices = await prisma.service.count({
      where: whereCondition,
    });

    const services = await prisma.service.findMany({
      where: whereCondition,
      skip,
      take: limitNumber,
      select: {
        serviceId: true,
        name: true,
        description: true,
        points:true
      },
    });

    res.json({
      success: true,
      total: totalServices,
      page: pageNumber,
      totalPages: Math.ceil(totalServices / limitNumber),
      data: services,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
});





module.exports = router