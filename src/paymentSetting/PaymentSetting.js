const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");

const detectMode = require("./detectMode");
const createWebhook = require("./createWebhook");


/**
 * CREATE Payment Setting
 * Usually only ONE record is needed (admin level)
 */
router.post("/settings/payment", async (req, res) => {
  try {
    const { razorpayKeyId, razorpaySecret, alertEmail, isRazorpayEnabled } = req.body;

    // Detect TEST / LIVE
    const mode = detectMode(razorpayKeyId);
    if (mode === "UNKNOWN") {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay Key",
      });
    }

    // Limit max Razorpay accounts
    const total = await prisma.paymentSetting.count();
    if (total >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 Razorpay accounts allowed",
      });
    }

    // If enabling this account, disable all others
    if (isRazorpayEnabled) {
      await prisma.paymentSetting.updateMany({
        data: { isRazorpayEnabled: false },
      });
    }

    // Create webhook if enabled
    let webhookId = null;
    let webhookSecret = null;
    if (isRazorpayEnabled) {
      const webhookData = await createWebhook(razorpayKeyId, razorpaySecret, alertEmail);
      if (webhookData) {
        webhookId = webhookData.webhookId;
        webhookSecret = webhookData.webhookSecret;
      }
    }

    // Save to database
    const setting = await prisma.paymentSetting.create({
      data: {
        razorpayKeyId,
        razorpaySecret,
        mode,
        webhookId,
        webhookSecret,
        alertEmail,
        isRazorpayEnabled,
      },
    });

    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/settings/payment", async (req, res) => {
  try {
    const settings = await prisma.paymentSetting.findMany({
      select: {
        paymentSettingId: true,
        razorpayKeyId: true,
        isRazorpayEnabled: true,
        webhookId: true,
        alertEmail: true,
        updatedAt: true,
      },
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE payment setting
router.put("/settings/payment/:paymentSettingId", async (req, res) => {
  try {
    const { paymentSettingId } = req.params;
    const { razorpayKeyId, razorpaySecret, alertEmail, isRazorpayEnabled } = req.body;

    const mode = detectMode(razorpayKeyId);
    if (mode === "UNKNOWN") {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay Key",
      });
    }

    // Only one active Razorpay account
    if (isRazorpayEnabled) {
      await prisma.paymentSetting.updateMany({
        where: { NOT: { paymentSettingId } },
        data: { isRazorpayEnabled: false },
      });
    }

    // Create webhook if enabled
    let webhookId = null;
    let webhookSecret = null;
    if (isRazorpayEnabled) {
      const webhookData = await createWebhook(razorpayKeyId, razorpaySecret, alertEmail);
      if (webhookData) {
        webhookId = webhookData.webhookId;
        webhookSecret = webhookData.webhookSecret;
      }
    }

    // Update database
    const updated = await prisma.paymentSetting.update({
      where: { paymentSettingId },
      data: {
        razorpayKeyId,
        razorpaySecret,
        mode,
        webhookId,
        webhookSecret,
        alertEmail,
        isRazorpayEnabled,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



module.exports = router




