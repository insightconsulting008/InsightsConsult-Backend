const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");
const crypto = require("crypto");
const {createNotification} = require("../../src/notifications/notificationService")


router.post("/webhook", async (req, res) => {
  try {
    // Get webhook secret from database
    const setting = await prisma.paymentSetting.findFirst({
           where: { isRazorpayEnabled: true }});

           console.log("settings",setting)

    if (!setting) {
      console.error("Payment settings not found");
      return res.status(500).send("Payment settings not configured");
    }
    
    const secret = setting.webhookSecret;

    // Verify webhook signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      console.error("Invalid signature");
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;
    console.log(`📨 Received webhook event: ${event.event}`);

    /* ===============================
       PAYMENT CAPTURED (Standard Orders)
    =============================== */
    if (event.event === "payment.captured") {
      const orderId = event.payload.payment.entity.order_id;
      const paymentId = event.payload.payment.entity.id;
      
      console.log(`Processing payment.captured for order: ${orderId}`);

      const payment = await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: { 
          status: "PAID",
          razorpayPaymentId: paymentId,
          paidAt: new Date()
        },
      });

      console.log(`Payment ${payment.paymentId} marked as PAID`);

      // 🔓 UNLOCK SERVICE (if it's a service purchase)
      if (payment.serviceId) {
        await prisma.myService.create({
          data: {
            userId: payment.userId,
            serviceId: payment.serviceId,
            status: "NOT_STARTED",
          },
        });
        console.log(`Service ${payment.serviceId} unlocked for user ${payment.userId}`);
      }

      // 🔓 UNLOCK BUNDLE (if it's a bundle purchase)
      if (payment.bundleId) {
        const bundle = await prisma.serviceBundle.findUnique({
          where: { bundleId: payment.bundleId },
          include: { services: true },
        });

        const data = bundle.services.map(s => ({
          userId: payment.userId,
          serviceId: s.serviceId,
          bundleId: payment.bundleId,
          status: "NOT_STARTED",
        }));

        await prisma.myService.createMany({ data });
        console.log(`Bundle ${payment.bundleId} unlocked with ${data.length} services`);
      }
    }

    /* ===============================
       PAYMENT LINK PAID
    =============================== */
    if (event.event === "payment_link.paid") {
      const paymentLinkId = event.payload.payment_link.entity.id;
      const paymentId = event.payload.payment.entity.id;
      
      console.log(`Processing payment_link.paid for link: ${paymentLinkId}`);
      console.log(`Processing payment for link: ${paymentId}`);

      // Find payment by either order_id or payment_link_id
      let payment = await prisma.payment.findFirst({
        where: { 
          OR: [
            { razorpayOrderId: paymentLinkId },
            { razorpayPaymentId: paymentId }
          ]
        }
      });

      console.log(payment,":jaromjery")

      if (!payment) {
        console.log(`Payment not found for link: ${paymentLinkId}`);
        return res.status(200).json({ received: true }); // Acknowledge but don't process
      }

      // Update payment record
    const  updatePayment = await prisma.payment.update({
        where: { paymentId: payment.paymentId },
        data: {
          status: "PAID",
          razorpayPaymentId: paymentId,
          paidAt: new Date(),
        },
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });

      
      console.log(updatePayment,":jaromjery")

      console.log(`Payment ${updatePayment.paymentId} marked as PAID via payment link`);

      if (updatePayment.createdById) {
        createNotification({
          title: "Amendment Payment Received",
          description: `Amendment payment of ₹${updatePayment.amount} has been successfully completed by ${updatePayment.user?.name || "External customer"}.`,
          employeeId: updatePayment.createdById,
        
          // 👇 Use this for button action
          redirectUrl:"/amendment",
        
        }).catch(console.error);
      }

      if (updatePayment.userId) {
          createNotification({
            title: "Payment Successful",
            description: `Your amendment payment of ₹${updatePayment.amount} has been successfully completed.`,
            userId: updatePayment.userId,
            redirectUrl: "/transactions", // you can change this
          }).catch(console.error);
      }
    



      // ✅ Notify User

      

      // // Handle AMENDMENT type payments
      // if (payment.type === "AMENDMENT") {
      //   await prisma.amendment.create({
      //     data: {
      //       paymentId: payment.paymentId,
      //       status: "ACTIVE",
      //       activatedAt: new Date(),
      //     },
      //   });
      //   console.log(`✅ Amendment activated for payment: ${payment.paymentId}`);
      // }

      // // If this is a service/bundle purchase via payment link
      // if (payment.serviceId) {
      //   await prisma.myService.create({
      //     data: {
      //       userId: payment.userId,
      //       serviceId: payment.serviceId,
      //       status: "NOT_STARTED",
      //     },
      //   });
      //   console.log(`Service ${payment.serviceId} unlocked via payment link`);
      // }

      // if (payment.bundleId) {
      //   const bundle = await prisma.serviceBundle.findUnique({
      //     where: { bundleId: payment.bundleId },
      //     include: { services: true },
      //   });

      //   const data = bundle.services.map(s => ({
      //     userId: payment.userId,
      //     serviceId: s.serviceId,
      //     bundleId: payment.bundleId,
      //     status: "NOT_STARTED",
      //   }));

      //   await prisma.myService.createMany({ data });
      //   console.log(`Bundle ${payment.bundleId} unlocked via payment link`);
      // }
    }

    /* ===============================
       PAYMENT FAILED
    =============================== */
    // if (event.event === "payment.failed") {
    //   const orderId = event.payload.payment.entity.order_id;
    //   const errorDesc = event.payload.payment.entity.error_description;
    //   const errorCode = event.payload.payment.entity.error_code;
      
    //   console.log(`Payment failed for order: ${orderId}, Error: ${errorCode}`);

    //   await prisma.payment.update({
    //     where: { razorpayOrderId: orderId },
    //     data: { 
    //       status: "FAILED",
    //       errorDescription: errorDesc,
    //       errorCode: errorCode
    //     },
    //   });
    // }

    // /* ===============================
    //    PAYMENT LINK EXPIRED
    // =============================== */
    // if (event.event === "payment_link.expired") {
    //   const paymentLinkId = event.payload.payment_link.entity.id;
      
    //   console.log(`Payment link expired: ${paymentLinkId}`);

    //   await prisma.payment.updateMany({
    //     where: { 
    //       OR: [
    //         { razorpayOrderId: paymentLinkId },
    //         { razorpayPaymentLink: paymentLinkId }
    //       ]
    //     },
    //     data: { status: "EXPIRED" },
    //   });
    // }

    // /* ===============================
    //    PAYMENT LINK CANCELLED
    // =============================== */
    // if (event.event === "payment_link.cancelled") {
    //   const paymentLinkId = event.payload.payment_link.entity.id;
      
    //   console.log(`Payment link cancelled: ${paymentLinkId}`);

    //   await prisma.payment.updateMany({
    //     where: { 
    //       OR: [
    //         { razorpayOrderId: paymentLinkId },
    //         { razorpayPaymentLink: paymentLinkId }
    //       ]
    //     },
    //     data: { status: "CANCELLED" },
    //   });
    // }

    res.json({ received: true });

  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("Webhook error");
  }
});

module.exports = router