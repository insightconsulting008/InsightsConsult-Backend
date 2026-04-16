const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");


router.get("/", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search?.trim() || "";
  
      const skip = (page - 1) * limit;
  
      const where = search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {};
  
      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.service.count({
          where,
        }),
      ]);
  
      res.json({
        success: true,
        pagination: {
          page,
          limit,
          totalRecords: total,
          totalPages: Math.ceil(total / limit),
        },
        services,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
    
router.get("/:serviceId", async (req, res) => {
      const { serviceId } = req.params;
    
      try {
        const service = await prisma.service.findUnique({
          where: {
            serviceId, // make sure your model field name is correct
          },
          include: {
            inputFields: true,   
            trackSteps: true,
          },
        });
    
        if (!service) {
          return res.status(404).json({
            success: false,
            message: "Service not found",
          });
        }
    
        res.json({ success: true, service });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

module.exports = router;  