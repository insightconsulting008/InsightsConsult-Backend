const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");

// ===============================
// GET Requested Documents (USER uploads)
// ===============================
router.get("/documents/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
  
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit ) || 10;
      const skip = (page - 1) * limit;
  
      const month = parseInt(req.query.month );
      const year = parseInt(req.query.year );
  
      let dateFilter = {};
  
      if (!isNaN(month) && !isNaN(year)) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);
  
        dateFilter = {
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        };
      }
  
      const whereCondition = {
        flow: "REQUESTED",
        NOT: { fileUrl: null },
        ...dateFilter,
        OR: [
          { applicationTrackStep: { application: { userId } } },
          { periodStep: { servicePeriod: { application: { userId } } } },
        ],
      };
  
      const documents = await prisma.serviceDocument.findMany({
        where: whereCondition,
        select: {
          fileUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
  
      const total = await prisma.serviceDocument.count({
        where: whereCondition,
      });
  
      res.json({
        success: true,
        page,
        limit,
        total,
        documents,
      });
    } catch (error) {
      console.error("Get requested documents error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });


module.exports = router
  