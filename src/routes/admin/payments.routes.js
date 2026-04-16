const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");


router.get("/", async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", type, startDate, endDate } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    let whereCondition = {};

    // TYPE FILTER
    if (type) {
      whereCondition.type = type;
    }

    // SEARCH
    if (search) {
      whereCondition.OR = [
        { paymentId: { contains: search } },
        { razorpayOrderId: { contains: search } },
        { razorpayPaymentId: { contains: search } },
        { status: { contains: search } }
      ];
    }

    // DATE FILTER
    if (startDate && endDate) {
      whereCondition.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit,
        include: {
          // Include user details for the userId field
          user: {
            select: {
     
              name: true,
              email: true,
              phoneNumber: true
            }
          },
          // Include creator details for the createdById field
          createdBy: {
            select: {
   
              name: true,
              employeeCode: true,
              email: true,
              mobileNumber: true,
              role: true
            }
          }
        }
      }),

      prisma.payment.count({
        where: whereCondition
      })
    ]);

    res.json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: payments
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router