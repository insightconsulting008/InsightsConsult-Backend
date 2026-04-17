const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");
const detectMode = require("./detectMode");
const createWebhook = require("./createWebhook");



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

// 🔐 Webhook URL validation
const isValidWebhookUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// ================= CREATE =================
router.post("/payment", async (req, res) => {
  try {
    const {
      razorpayKeyId,
      razorpaySecret,
      alertEmail,
      profilePassword,
      webhookUrl
    } = req.body;

    const employeeId = req.user.id;

    // 🔐 Password check
    if (!(await verifyPassword(employeeId, profilePassword))) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    // 🧠 Mode detect
    const mode = detectMode(razorpayKeyId);
    if (mode === "UNKNOWN") {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay Key"
      });
    }

    // 🚫 Max 3 accounts
    const total = await prisma.paymentSetting.count();
    if (total >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 Razorpay accounts allowed"
      });
    }

    // 🚫 Only one active

    // 🚀 Create webhook
      if (!isValidWebhookUrl(webhookUrl)) {
        return res.status(400).json({
          success: false,
          message: "Invalid webhook URL"
        });
      }

      const webhookData = await createWebhook(
        razorpayKeyId,
        razorpaySecret,
        alertEmail,
        webhookUrl
      );

      
      await prisma.paymentSetting.updateMany({
        data: { isRazorpayEnabled: false }
      });

      const isRazorpayEnabled = true;


    // 💾 Save
    await prisma.paymentSetting.create({
      data: {
        razorpayKeyId,
        razorpaySecret,
        mode,
        webhookId:  webhookData.webhookId,
        webhookSecret:  webhookData.webhookSecret,
        webhookUrl,
        alertEmail,
        isRazorpayEnabled
      }
    });

    res.json({
      success: true,
      message: "Payment settings saved successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= GET =================
router.get("/payment",  async (req, res) => {
  try {
    const settings = await prisma.paymentSetting.findMany({
      select: {
        paymentSettingId: true,
        isRazorpayEnabled: true,
        webhookId: true,
        webhookUrl: true,
        alertEmail: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================= TOGGLE (ON/OFF) =================
router.put("/payment/:paymentSettingId",
  async (req, res) => {
    try {
      const { paymentSettingId } = req.params;
      const { isRazorpayEnabled, profilePassword } = req.body;
      const employeeId = req.user.id;

      // 🔐 Password check
      if (!(await verifyPassword(employeeId, profilePassword))) {
        return res.status(401).json({
          success: false,
          message: "Invalid password"
        });
      }

      const existing = await prisma.paymentSetting.findUnique({
        where: { paymentSettingId }
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Not found"
        });
      }

      // 🚫 Only one active
      if (isRazorpayEnabled === true) {
        await prisma.paymentSetting.updateMany({
          where: { NOT: { paymentSettingId } },
          data: { isRazorpayEnabled: false }
        });
      }

      const updated = await prisma.paymentSetting.update({
        where: { paymentSettingId },
        data: { isRazorpayEnabled }
      });

      res.json({
        success: true,
        message: `Payment ${isRazorpayEnabled ? "enabled" : "disabled"} successfully`,
        data: updated
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ================= DELETE =================
router.delete("/payment/:paymentSettingId",
  async (req, res) => {
    try {
      const { paymentSettingId } = req.params;
      const { profilePassword } = req.body;
      const employeeId = req.user.id;

      // 🔐 Password check
      if (!(await verifyPassword(employeeId, profilePassword))) {
        return res.status(401).json({
          success: false,
          message: "Invalid password"
        });
      }

      const setting = await prisma.paymentSetting.findUnique({
        where: { paymentSettingId }
      });

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: "Payment setting not found"
        });
      }

      // 🚫 Prevent deleting active
      if (setting.isRazorpayEnabled) {
        return res.status(400).json({
          success: false,
          message: "Disable the account before deleting"
        });
      }

      await prisma.paymentSetting.delete({
        where: { paymentSettingId }
      });

      res.json({
        success: true,
        message: "Payment setting deleted successfully"
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router








/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// function isValidWebhookUrl(url) {
//   try {
//     const parsed = new URL(url);
//     return parsed.protocol === "https:";
//   } catch {
//     return false;
//   }
// }

// /**
//  * CREATE Payment Setting
//  * Usually only ONE record is needed (admin level)
//  */
// // router.post("/settings/payment",authenticate,authorizeRoles("ADMIN"), async (req, res) => {
// //   try {

// //     const { razorpayKeyId, razorpaySecret, alertEmail, isRazorpayEnabled, profilePassword, webhookUrl } = req.body;
    
// //     const employeeId = req.user.id;

// //     const isValid = await verifyPassword(employeeId, profilePassword);
// //     if (!isValid) {
// //       return res.status(402).json({
// //         success: false,
// //         message: "Invalid password."
// //       });
// //     }

// //     // Detect TEST / LIVE
// //     const mode = detectMode(razorpayKeyId);
// //     if (mode === "UNKNOWN") {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid Razorpay Key",
// //       });
// //     }

// //     // Limit max Razorpay accounts
// //     const total = await prisma.paymentSetting.count();
// //     if (total >= 3) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Maximum 3 Razorpay accounts allowed",
// //       });
// //     }

// //     // If enabling this account, disable all others
// //     if (isRazorpayEnabled) {
// //       await prisma.paymentSetting.updateMany({
// //         data: { isRazorpayEnabled: false },
// //       });
// //     }

// //     // Create webhook if enabled
// //     let webhookId = null;
// //     let webhookSecret = null;
// //     if (isRazorpayEnabled) {

// //       if (!isValidWebhookUrl(webhookUrl)) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Invalid webhook URL"
// //         });
// //       }
// //       const webhookData = await createWebhook(razorpayKeyId, razorpaySecret, alertEmail,webhookUrl);
    
// //       if (webhookData) {
// //         webhookId = webhookData.webhookId;
// //         webhookSecret = webhookData.webhookSecret;
// //       }
// //     }

// //     // Save to database
// //   await prisma.paymentSetting.create({
// //       data: {
// //         razorpayKeyId,
// //         razorpaySecret,
// //         mode,
// //         webhookId,
// //         webhookSecret,
// //         webhookUrl,
// //         alertEmail,
// //         isRazorpayEnabled,
// //       },
// //     });

// //     res.json({ success: true, message: "Payment settings saved successfully",});
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // });

// // router.get("/settings/payment",authenticate,authorizeRoles("ADMIN"), async (req, res) => {
// //   try {
// //     const settings = await prisma.paymentSetting.findMany({
// //       select: {
// //         paymentSettingId: true,
// //         razorpayKeyId: true,
// //         isRazorpayEnabled: true,
// //         webhookId: true,
// //         alertEmail: true,
// //         updatedAt: true,
// //       },
// //     });

// //     res.json({ success: true, data: settings });
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // });


// // router.put("/settings/payment/:paymentSettingId", authenticate, authorizeRoles("ADMIN"),
// //   async (req, res) => {
// //     try {
// //       console.log("👉 TOGGLE PAYMENT STATUS");

// //       const { paymentSettingId } = req.params;
// //       const { isRazorpayEnabled, profilePassword } = req.body;

// //       const employeeId = req.user.id;

// //       // 🔐 Password Check
// //       const isValid = await verifyPassword(employeeId, profilePassword);
// //       if (!isValid) {
// //         return res.status(402).json({
// //           success: false,
// //           message: "Invalid password"
// //         });
// //       }

// //       // 📦 Get Existing
// //       const existing = await prisma.paymentSetting.findUnique({
// //         where: { paymentSettingId }
// //       });

// //       if (!existing) {
// //         return res.status(404).json({
// //           success: false,
// //           message: "Not found"
// //         });
// //       }

// //       // 🚫 Only One Active Account
// //       if (isRazorpayEnabled === true) {
// //         await prisma.paymentSetting.updateMany({
// //           where: { NOT: { paymentSettingId } },
// //           data: { isRazorpayEnabled: false }
// //         });
// //       }

// //       // 🔁 ONLY toggle status
// //       const updated = await prisma.paymentSetting.update({
// //         where: { paymentSettingId },
// //         data: {
// //           isRazorpayEnabled
// //         }
// //       });

// //       console.log("✅ STATUS UPDATED:", updated);

// //       res.json({
// //         success: true,
// //         message: `Payment ${isRazorpayEnabled ? "enabled" : "disabled"} successfully`,
// //         data: updated
// //       });

// //     } catch (error) {
// //       console.error("❌ ERROR:", error);
// //       res.status(500).json({
// //         success: false,
// //         message: error.message
// //       });
// //     }
// //   }
// // );

// // // DELETE payment setting
// // router.delete("/settings/payment/:paymentSettingId",authenticate,authorizeRoles("ADMIN"),async (req, res) => {
// //   try {
// //     const { paymentSettingId } = req.params;
// //     const { profilePassword } = req.body;
// //     const employeeId = req.user.id;

// //     // Verify admin password
// //     const isValid = await verifyPassword(employeeId, profilePassword);
// //     if (!isValid) {
// //       return res.status(402).json({
// //         success: false,
// //         message: "Invalid password. Payment settings not deleted.",
// //       });
// //     }

// //     // Check if payment setting exists
// //     const setting = await prisma.paymentSetting.findUnique({
// //       where: { paymentSettingId },
// //     });

// //     if (!setting) {
// //       return res.status(402).json({
// //         success: false,
// //         message: "Payment setting not found",
// //       });
// //     }

// //     // Optional safety check
// //     if (setting.isRazorpayEnabled) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Disable the Razorpay account before deleting it",
// //       });
// //     }

// //     // Delete
// //     await prisma.paymentSetting.delete({
// //       where: { paymentSettingId },
// //     });

// //     res.json({
// //       success: true,
// //       message: "Payment setting deleted successfully",
// //     });
// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: error.message,
// //     });
// //   }
// // }
// // );




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// // UPDATE payment setting
// // router.put("/settings/payment/:paymentSettingId",authenticate,authorizeRoles("ADMIN"), async (req, res) => {
// //   try {
// //     const { paymentSettingId } = req.params;
// //     const { razorpayKeyId, razorpaySecret, alertEmail, isRazorpayEnabled, profilePassword} = req.body;
// //     const employeeId = req.user.id;

// //     const isValid = await verifyPassword(employeeId, profilePassword);
// //     if (!isValid) {
// //       return res.status(402).json({
// //         success: false,
// //         message: "Invalid password."
// //       });
// //     }

// //     const mode = detectMode(razorpayKeyId);
// //     if (mode === "UNKNOWN") {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid Razorpay Key",
// //       });
// //     }

// //     // Only one active Razorpay account
// //     if (isRazorpayEnabled) {
// //       await prisma.paymentSetting.updateMany({
// //         where: { NOT: { paymentSettingId } },
// //         data: { isRazorpayEnabled: false },
// //       });
// //     }

// //     // Create webhook if enabled
// //     let webhookId = null;
// //     let webhookSecret = null;
// //     if (isRazorpayEnabled) {
// //       const webhookData = await createWebhook(razorpayKeyId, razorpaySecret, alertEmail);
// //       if (webhookData) {
// //         webhookId = webhookData.webhookId;
// //         webhookSecret = webhookData.webhookSecret;
// //       }
// //     }

// //  await prisma.paymentSetting.update({
// //       where: { paymentSettingId },
// //       data: {
// //         razorpayKeyId,
// //         razorpaySecret,
// //         mode,
// //         webhookId,
// //         webhookSecret,
// //         alertEmail,
// //         isRazorpayEnabled,
// //       },
// //     });

// //     res.json({ success: true,  message: "Payment settings updated successfully"});
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // });





// router.put("/settings/payment/:paymentSettingId",authenticate,authorizeRoles("ADMIN"),
//   async (req, res) => {
//     try {
//       console.log("👉 UPDATE PAYMENT SETTINGS API");

//       const { paymentSettingId } = req.params;
//       const {
//         razorpayKeyId,
//         razorpaySecret,
//         alertEmail,
//         isRazorpayEnabled,
//         profilePassword
//       } = req.body;

//       const employeeId = req.user.id;

//       // 🔐 Password Check
//       const isValid = await verifyPassword(employeeId, profilePassword);
//       if (!isValid) {
//         return res.status(402).json({
//           success: false,
//           message: "Invalid password"
//         });
//       }

//       // 📦 Get Existing Data
//       const existing = await prisma.paymentSetting.findUnique({
//         where: { paymentSettingId }
//       });

//       if (!existing) {
//         return res.status(404).json({
//           success: false,
//           message: "Not found"
//         });
//       }

     

//       // 🧠 Merge Values
//       const finalKeyId = razorpayKeyId ?? existing.razorpayKeyId;
//       const finalSecret = razorpaySecret ?? existing.razorpaySecret;
//       const finalEmail = alertEmail ?? existing.alertEmail;
//       const finalEnabled =
//         typeof isRazorpayEnabled === "boolean"
//           ? isRazorpayEnabled
//           : existing.isRazorpayEnabled;

//       console.log("🧠 Final Values:", {
//         finalKeyId,
//         finalSecret,
//         finalEmail,
//         finalEnabled
//       });

//       // ⚙️ Mode Detection
//       let mode = existing.mode;
//       if (razorpayKeyId) {
//         mode = detectMode(finalKeyId);
//         if (mode === "UNKNOWN") {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid Razorpay Key"
//           });
//         }
//       }

//       // 🚫 Only One Active Account
//       if (finalEnabled) {
//         await prisma.paymentSetting.updateMany({
//           where: { NOT: { paymentSettingId } },
//           data: { isRazorpayEnabled: false }
//         });
//       }

//       // 🔄 Check if webhook needs recreation
//       const shouldRecreateWebhook =
//         finalEnabled &&
//         (
//           razorpayKeyId ||
//           razorpaySecret ||
//           alertEmail ||
//           !existing.webhookId
//         );

//       let webhookId = existing.webhookId;
//       let webhookSecret = existing.webhookSecret;

//       if (shouldRecreateWebhook) {
//         console.log("🔄 Recreating Webhook...");

//         // 🗑️ Delete old webhook
//         if (existing.webhookId) {
//           await deleteWebhook(
//             existing.accountId,
//             existing.webhookId,
//             finalKeyId,
//             finalSecret
//           );
//         }

//         // 🚀 Create new webhook
//         const webhookData = await createWebhook(
//           finalKeyId,
//           finalSecret,
//           finalEmail
//         );

//         if (webhookData) {
//           webhookId = webhookData.webhookId;
//           webhookSecret = webhookData.webhookSecret;
//         }
//       }

//       // 💾 Update DB
//       const updated = await prisma.paymentSetting.update({
//         where: { paymentSettingId },
//         data: {
//           razorpayKeyId: finalKeyId,
//           razorpaySecret: finalSecret,
//           alertEmail: finalEmail,
//           isRazorpayEnabled: finalEnabled,
//           mode,
//           webhookId,
//           webhookSecret
//         }
//       });

//       console.log("✅ FINAL UPDATED DATA:", updated);

//       res.json({
//         success: true,
//         message: "Payment settings updated successfully",
//         data: updated
//       });

//     } catch (error) {
//       console.error("❌ ERROR:", error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   }
// );