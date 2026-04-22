const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const {sendEmail} = require("../../email/emailService")


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

        const hrefWebsiteLink = "https://insightconsulting.info";
        const WebsiteLink = "www.insightconsulting.info";
        const companyName = "Insight Consulting";

        const user = await prisma.user.findUnique({
            where: {
              userId: userId,
            },
          });


            // Fetch service or bundle name
  let serviceLabel = "";

  if (serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    serviceLabel = service?.name || `Service ID: ${serviceId}`;
  } else if (bundleId) {
    const bundle = await prisma.serviceBundle.findUnique({
      where: { id: bundleId },
    });
    serviceLabel = bundle?.name || `Bundle ID: ${bundleId}`;
  }

      await prisma.serviceRequest.create({
        data: {
          userId,
          serviceId: serviceId || null,
          bundleId: bundleId || null,
          status: "PENDING",
        },
      });


      await sendEmail({
        eventName: "REQUEST_RECEIVED",
        to: user.email,
        subject: "We've received your request",
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;">
          <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;">
      
            <div style="border-left: 3px solid #f13c20; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">Request received</h2>
              <p style="margin: 0; font-size: 13px; color: #888;">${companyName}</p>
            </div>
      
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 12px;">
              Hi <strong>${user.name}</strong>,
            </p>
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 12px;">
              Thank you for submitting your request. We have received it and our team will get back to you shortly.
            </p>
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
              If you have any questions in the meantime, feel free to reach out to us.
            </p>
      
            <a href="${hrefWebsiteLink}/my-requests"
               style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
              View my request
            </a>
      
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" />
            <p style="margin: 0 0 6px; color: #aaa; font-size: 12px; text-align: center;">
              This is a confirmation from <strong style="color: #888;">${companyName}</strong>.
            </p>
            <p style="margin: 0; font-size: 12px; text-align: center;">
              <a href="${hrefWebsiteLink}" style="color: #f13c20; text-decoration: none;">${WebsiteLink}</a>
            </p>
      
          </div>
        </div>
        `,
      });

      const submittedAt = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      
      
      await sendEmail({
        eventName: "ADMIN_NEW_REQUEST",
        to: "insightconsulting008@gmail.com",
        subject: `New service request from ${user.name}`,
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;">
          <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;">
      
            <div style="border-left: 3px solid #f13c20; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">New service request</h2>
              <p style="margin: 0; font-size: 13px; color: #888;">Action required</p>
            </div>
      
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 12px;">
              <strong>${user.name}</strong> has requested a service while payment is currently disabled.
            </p>
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 6px;">
              <span style="color: #999;">Service:</span> &nbsp; ${serviceLabel}
            </p>
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 6px;">
              <span style="color: #999;">Submitted:</span> &nbsp; ${submittedAt}
            </p>
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
              Please review and approve or reject this request from the admin panel.
            </p>
      
            <a href="/applications"
               style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
              Review request
            </a>
      
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" />
            <p style="margin: 0 0 6px; color: #aaa; font-size: 12px; text-align: center;">
              Admin notification from <strong style="color: #888;">${companyName}</strong>.
            </p>
            <p style="margin: 0; font-size: 12px; text-align: center;">
              <a href="${hrefWebsiteLink}" style="color: #f13c20; text-decoration: none;">${WebsiteLink}</a>
            </p>
      
          </div>
        </div>
        `,
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
