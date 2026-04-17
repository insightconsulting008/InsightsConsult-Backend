const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const Razorpay = require("razorpay");
const {createNotification} = require("../../notifications/notificationService")





router.post("/create/amendment-link", async (req, res) => {
  try {

    const {employeeId, amount, note , userId} = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount required" });
    }

    const setting = await prisma.paymentSetting.findFirst({
      where:{
        isRazorpayEnabled:true
      }
    });

    if (!setting?.isRazorpayEnabled) {
      return res.status(400).json({
        message: "Payment disabled"
      });
    }

    const razorpay = new Razorpay({
      key_id: setting.razorpayKeyId,
      key_secret: setting.razorpaySecret,
    });

    const paymentLink = await razorpay.paymentLink.create({
      amount: Number(amount) * 100,
      currency: "INR",
      description: "Amendment Payment",
      notify: {
        sms: true,
        email: true,
      },
      notes: {
        type: "AMENDMENT",
        note: note || "Manual Amendment"
      }
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        type: "AMENDMENT",
        amount: amount,
        razorpayOrderId: paymentLink.id,
        razorpayPaymentLink: paymentLink.short_url,
        status: "CREATED",
        createdById:employeeId,
        userId:userId
      },
    });

      // 🔔 Notify USER (MAIN)
      if (userId) {
        createNotification({
          title: "Payment Required",
          description: `An amendment payment of ₹${amount} has been requested.${
            note ? `\nNote: ${note}` : ""
          }`,
          userId: userId,
        
          // 👇 Use this for button action
          redirectUrl: paymentLink.short_url,
        
          // 👇 OPTIONAL (Recommended for frontend control)
          meta: {
            cta: {
              label: "Pay Now",
              url: paymentLink.short_url,
            },
          },
        }).catch(console.error);
      }

    

    return res.json({
      success: true,
      paymentLink: paymentLink.short_url,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const { search } = req.query;

    const users = await prisma.user.findMany({
      where: {
        role: "USER", // 👈 condition added
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phoneNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        userId: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { search = "", page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    const whereCondition = {
      createdById: employeeId,
      ...(search && {
        OR: [
          { status: { contains: search, mode: "insensitive" } },
          { type: { contains: search, mode: "insensitive" } },

          // 👇 Razorpay fields
          { razorpayOrderId: { contains: search, mode: "insensitive" } },
          { razorpayPaymentId: { contains: search, mode: "insensitive" } },
          { razorpayPaymentLink: { contains: search, mode: "insensitive" } },

          // 👇 User fields
          {
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phoneNumber: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
    };

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where: whereCondition,
        include: {
          createdBy: { select: { name: true ,photoUrl: true } },
          user: {
            select: {
              name: true,
              email: true,
              phoneNumber: true,
              photoUrl:true,
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where: whereCondition }),
    ]);

    res.status(200).json({
      data: payments,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router