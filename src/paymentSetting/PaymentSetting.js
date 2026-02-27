const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");
const getRazorpayInstance = require('./RazorpayInstance')




/**
 * CREATE Payment Setting
 * Usually only ONE record is needed (admin level)
 */

router.post("/settings/payment",async (req, res) => {
  try {
    const {
      isRazorpayEnabled,
      razorpayKeyId,
      razorpaySecret,
      profilePassword
    } = req.body;

    // // 🔹 Verify profile password
    // const user = await prisma.user.findUnique({
    //   where: { userId: req.user.userId }
    // });

    // const isMatch = await bcrypt.compare(profilePassword, user.password);

    // if (!isMatch) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Incorrect profile password"
    //   });
    // }

    // 🔹 Limit 3 accounts
    const totalAccounts = await prisma.paymentSetting.count();
    if (totalAccounts >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 Razorpay accounts allowed"
      });
    }

    // 🔹 Only one active
    if (isRazorpayEnabled) {
      await prisma.paymentSetting.updateMany({
        data: { isRazorpayEnabled: false }
      });
    }

    const paymentSetting = await prisma.paymentSetting.create({
      data: {
        isRazorpayEnabled,
        razorpayKeyId,
        razorpaySecret,

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
    const setting = await prisma.paymentSetting.findMany({
      select: {
        paymentSettingId: true,
        isRazorpayEnabled:true,
        razorpayKeyId:true,
        updatedAt:true
      }
    });

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
      } = req.body;
  
      // // 🔹 Verify password
      // const user = await prisma.user.findUnique({
      //   where: { userId: req.user.userId }
      // });
  
      // const isMatch = await bcrypt.compare(profilePassword, user.password);
  
      // if (!isMatch) {
      //   return res.status(401).json({
      //     success: false,
      //     message: "Incorrect profile password"
      //   });
      // }
  
      // 🔹 Only one active
      if (isRazorpayEnabled) {
        await prisma.paymentSetting.updateMany({
          where: {
            NOT: { paymentSettingId }
          },
          data: { isRazorpayEnabled: false }
        });
      }
  
      const updated = await prisma.paymentSetting.update({
        where: { paymentSettingId },
        data: {
          isRazorpayEnabled,
          razorpayKeyId,
          razorpaySecret,
  
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