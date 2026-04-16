 const express = require("express");
 const router = express.Router();
 const prisma = require("../../prisma/prisma");
  

  // =============================
  // GET ALL BUNDLES
  // =============================
  router.get("/", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";
  
      const skip = (page - 1) * limit;
  
      const whereCondition = search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {};
  
      const [bundles, total] = await Promise.all([
        prisma.serviceBundle.findMany({
          where: whereCondition,
          skip: skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            services: {
              select: {
                serviceId: true,
                name: true,
              },
            },
          },
        }),
  
        prisma.serviceBundle.count({
          where: whereCondition,
        }),
      ]);
  
      res.json({
        success: true,
        pagination: {
          totalRecords: total,
          currentPage: page,
          limit: limit,
          totalPages: Math.ceil(total / limit),
        },
        bundles,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  router.get("/:bundleId/details", async (req, res) => {
    const { bundleId } = req.params;
  
    try {
      const bundle = await prisma.serviceBundle.findUnique({
        where: { bundleId },
        include: {
          services:{
            select:{
             serviceId:true,
             name:true,
             description:true,
             photoUrl:true,
             serviceType:true,
             offerPrice:true,
             
            }
          }  // only services, no inputFields or trackSteps
        }
      });
  
      if (!bundle) {
        return res.status(404).json({
          success: false,
          message: "Bundle not found"
        });
      }
  
      return res.status(200).json({
        success: true,
        bundle
      });
  
    } catch (error) {
  
      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  });

  module.exports = router