const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");


router.post("/buy", async (req, res) => {
  try {
    const { userId, serviceId, bundleId } = req.body;

    if ((!serviceId && !bundleId) || (serviceId && bundleId)) {
      return res.status(400).json({
        success: false,
        message: "Provide either serviceId or bundleId",
      });
    }

    // 🔑 Get payment settings
    const setting = await prisma.paymentSetting.findFirst({
      where:{
        isRazorpayEnabled:true
      }
    });

    /* ===================================================
       PAYMENT DISABLED → DIRECT UNLOCK
    =================================================== */
    if (!setting?.isRazorpayEnabled) {

      await prisma.serviceRequest.create({
        data: {
          userId,
          serviceId: serviceId || null,
          bundleId: bundleId || null,
          status: "PENDING",
        },
      });
    
      return res.json({
        success: true,
        paymentRequired: false,
        message: "Request sent to admin for approval",
      });

      // if (serviceId) {
      //   const myService = await prisma.myService.create({
      //     data: { userId, serviceId, status: "NOT_STARTED" },
      //   });

      //   return res.json({
      //     success: true,
      //     message: "Service unlocked",
      //     paymentRequired: false,
      //     myService,
      //   });
      // }

      // if (bundleId) {
      //   const bundle = await prisma.serviceBundle.findUnique({
      //     where: { bundleId },
      //     include: { services: true },
      //   });

      //   const data = bundle.services.map(s => ({
      //     userId,
      //     serviceId: s.serviceId,
      //     bundleId,
      //     status: "NOT_STARTED",
      //   }));

      //   await prisma.myService.createMany({ data });

      //   return res.json({
      //     success: true,
      //     paymentRequired: false,
      //     message: "Bundle unlocked ",
      //   });
      // }
    }

    /* ===================================================
       PAYMENT ENABLED → CREATE RAZORPAY ORDER
    =================================================== */

    let amount;

    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { serviceId },
      });

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      amount = service.finalIndividualPrice;
    }

    if (bundleId) {
      const bundle = await prisma.serviceBundle.findUnique({
        where: { bundleId },
      });

      if (!bundle) {
        return res.status(404).json({ message: "Bundle not found" });
      }

      amount = bundle.finalBundlePrice;
    }

    const razorpay = new Razorpay({
      key_id: setting.razorpayKeyId,
      key_secret: setting.razorpaySecret,
    });


    const order = await razorpay.orders.create({
      amount :  Number(amount) * 100,
      currency: "INR",
    });

    // 🔑 Save payment record (NOT PAID YET)
    await prisma.payment.create({
      data: {
        userId,
        serviceId,
        bundleId,
        type: "ORDER",
        razorpayOrderId: order.id,
        amount: (order.amount) / 100,
        status: "CREATED",
      },
    });

    return res.json({
      success: true,
      paymentRequired: true,
      orderId: order.id,
      key: setting.razorpayKeyId,
      amount,
      currency: "INR",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, message:"Server error"});
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const whereCondition = {
      userId,
      OR: [
        {
          service: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          serviceBundle: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ],
    };

    const total = await prisma.myService.count({
      where: whereCondition,
    });

    const data = await prisma.myService.findMany({
      where: whereCondition,   // ✅ use search condition
      skip: skip,              // ✅ pagination
      take: limit,             // ✅ limit
      orderBy: {
        createdAt: "desc",     // ✅ latest first
      },
      select: {
        myServiceId:true,
        userId: true,
        serviceId: true,
        bundleId: true,
        status: true,
        createdAt: true,
        service: {
          select: {
            serviceId: true,
            name: true,
            description: true,
            photoUrl: true,
            serviceType:true,
          },
        },
        serviceBundle: {
          select: {
            bundleId: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/:myServiceId/details", async (req, res) => {
  try {
    const { myServiceId } = req.params;

    if (!myServiceId) {
      return res.status(400).json({ success: false, message: "myServiceId is required" });
    }

    const service = await prisma.myService.findUnique({
      where: { myServiceId },
      include: {
        service: true,
        serviceBundle: { include: { services: true } },
        application: {
          include: {
            applicationTrackStep: { include: { serviceDocument: true } },
            servicePeriod: { include: { periodStep: { include: { serviceDocument: true } } } },
          },
        },
      },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    res.json({ success: true, data: service });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router
