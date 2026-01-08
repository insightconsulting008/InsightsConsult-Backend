const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");



/**
 * CREATE Payment Setting
 * Usually only ONE record is needed (admin level)
 */
router.post("/settings/payment", async (req, res) => {
    try {
      const {
        isRazorpayEnabled,
        razorpayKeyId,
        razorpaySecret,
        webhookSecret
      } = req.body;
  
      const paymentSetting = await prisma.paymentSetting.create({
        data: {
          isRazorpayEnabled,
          razorpayKeyId,
          razorpaySecret,
          webhookSecret
        }
      });
  
      res.status(201).json({
        success: true,
        data: paymentSetting
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });


router.get("/settings/payment", async (req, res) => {
    try {
      const setting = await prisma.paymentSetting.findMany();
  
      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });


router.put("/settings/payment/:paymentSettingId", async (req, res) => {
    try {
      const { paymentSettingId } = req.params;
      const {
        isRazorpayEnabled,
        razorpayKeyId,
        razorpaySecret,
        webhookSecret
      } = req.body;
  
      const updated = await prisma.paymentSetting.update({
        where: { paymentSettingId  },
        data: {
          isRazorpayEnabled,
          razorpayKeyId,
          razorpaySecret,
          webhookSecret
        }
      });
  
      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
   
  



module.exports = router