const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");

router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
  
      const { page = 1, limit = 10, search = "", type } = req.query;
  
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      const skip = (pageNumber - 1) * pageSize;
  
      // 🔍 Build WHERE condition
      const whereCondition = {
        userId: userId,
  
        // Filter by type (AMENDMENT / ORDER)
        ...(type && {
          type: type, // or { in: ["AMENDMENT", "ORDER"] } if multiple
        }),
  
        // Search logic
        ...(search && {
          OR: [
            {
              razorpayOrderId: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              razorpayPaymentId: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              razorpayPaymentLink: {
                contains: search,
                mode: "insensitive",
              },
            },
            // amount search (convert number → string match)
            {
              amount: isNaN(Number(search))
                ? undefined
                : Number(search),
            },
          ].filter(Boolean),
        }),
      };
  
      const [payments, totalCount] = await Promise.all([
        prisma.payment.findMany({
          where: whereCondition,
          orderBy: {
            createdAt: "desc",
          },
          skip: skip,
          take: pageSize,
          select: {
            paymentId: true,
            userId: true,
            createdById: true,
            serviceId: true,
            bundleId: true,
            type: true,
            amount: true,
            status: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            razorpayPaymentLink: true,
            paidAt: true,
            createdAt: true,
          },
        }),
        prisma.payment.count({
          where: whereCondition,
        }),
      ]);
  
      res.json({
        success: true,
        data: payments,
        pagination: {
          total: totalCount,
          page: pageNumber,
          limit: pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router