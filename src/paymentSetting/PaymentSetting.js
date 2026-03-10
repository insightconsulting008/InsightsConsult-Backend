const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");
const detectMode = require("./detectMode");
const createWebhook = require("./createWebhook");
const {authenticate,authorizeRoles} =require("../authMiddleware/authMiddleware")
const rateLimit = require('express-rate-limit');

// const passwordAttemptLimiter = rateLimit({
  
//   windowMs: 2 * 60 * 1000, // 15 minutes
//   max: 5, // 5 attempts
//   message: 'Too many password attempts, please try again later'
// });


const verifyPassword = async (employeeId, profilePassword) => {
  const employee = await prisma.employee.findUnique({
    where: { employeeId },
    select: { profilePassword: true } // Select only password field
  });
  
  if (!employee) return false;
  
  // Compare passwords directly (assuming plain text - though not recommended)
  // Or use whatever comparison method you're currently using
  return employee.profilePassword === profilePassword; // Simple comparison
};

/**
 * CREATE Payment Setting
 * Usually only ONE record is needed (admin level)
 */
router.post("/settings/payment",authenticate,authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const { razorpayKeyId, razorpaySecret, alertEmail, isRazorpayEnabled, profilePassword} = req.body;
    const employeeId = req.user.id;

    const isValid = await verifyPassword(employeeId, profilePassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password. Payment settings not saved."
      });
    }

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
  await prisma.paymentSetting.create({
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

    res.json({ success: true, message: "Payment settings saved successfully",});
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/settings/payment",authenticate,authorizeRoles("ADMIN"), async (req, res) => {
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
router.put("/settings/payment/:paymentSettingId",authenticate,authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const { paymentSettingId } = req.params;
    const { razorpayKeyId, razorpaySecret, alertEmail, isRazorpayEnabled, profilePassword} = req.body;
    const employeeId = req.user.id;

    const isValid = await verifyPassword(employeeId, profilePassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password. Payment settings not saved."
      });
    }

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

 await prisma.paymentSetting.update({
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

    res.json({ success: true,  message: "Payment settings updated successfully"});
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// DELETE payment setting
router.delete(
  "/settings/payment/:paymentSettingId",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { paymentSettingId } = req.params;
      const { profilePassword } = req.body;
      const employeeId = req.user.id;

      // Verify admin password
      const isValid = await verifyPassword(employeeId, profilePassword);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid password. Payment settings not deleted.",
        });
      }

      // Check if payment setting exists
      const setting = await prisma.paymentSetting.findUnique({
        where: { paymentSettingId },
      });

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: "Payment setting not found",
        });
      }

      // Optional safety check
      if (setting.isRazorpayEnabled) {
        return res.status(400).json({
          success: false,
          message: "Disable the Razorpay account before deleting it",
        });
      }

      // Delete
      await prisma.paymentSetting.delete({
        where: { paymentSettingId },
      });

      res.json({
        success: true,
        message: "Payment setting deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);


module.exports = router




