const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const config = require("../../utils/config")
const {applicationImgUpload,myDocuments} = require('../../utils/multer')
const{ authenticate,authorizeRoles } = require("../../authMiddleware/authMiddleware")
const Razorpay = require("razorpay");
const crypto = require("crypto");





router.post("/buy/service", async (req, res) => {
  try {
    const { userId, serviceId, bundleId } = req.body;

    if ((!serviceId && !bundleId) || (serviceId && bundleId)) {
      return res.status(400).json({
        success: false,
        message: "Provide either serviceId or bundleId",
      });
    }

    // 🔑 Get payment settings
    const setting = await prisma.paymentSetting.findFirst();

    /* ===================================================
       PAYMENT DISABLED → DIRECT UNLOCK
    =================================================== */
    if (!setting?.isRazorpayEnabled) {

      if (serviceId) {
        const myService = await prisma.myService.create({
          data: { userId, serviceId, status: "NOT_STARTED" },
        });

        return res.json({
          success: true,
          message: "Service unlocked",
          paymentRequired: false,
          myService,
        });
      }

      if (bundleId) {
        const bundle = await prisma.serviceBundle.findUnique({
          where: { bundleId },
          include: { services: true },
        });

        const data = bundle.services.map(s => ({
          userId,
          serviceId: s.serviceId,
          bundleId,
          status: "NOT_STARTED",
        }));

        await prisma.myService.createMany({ data });

        return res.json({
          success: true,
          paymentRequired: false,
          message: "Bundle unlocked ",
        });
      }
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


router.post("/razorpay/webhook", async (req, res) => {
  try {

    const secret = (await prisma.paymentSetting.findFirst()).razorpaySecret;

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body;

    /* ===============================
       PAYMENT SUCCESS
    =============================== */

    if (event.event === "payment.captured") {

      const orderId = event.payload.payment.entity.order_id;

      const payment = await prisma.payment.update({
        where: { razorpayOrderId: orderId },
        data: { status: "PAID" },
      });

      // 🔓 UNLOCK SERVICE

      if (payment.serviceId) {
        await prisma.myService.create({
          data: {
            userId: payment.userId,
            serviceId: payment.serviceId,
            status: "NOT_STARTED",
          },
        });
      }

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
      }
    }

    res.json({ received: true });

  } catch (err) {
    console.error(err);
    res.status(500).send("Webhook error");
  }
});

router.get("/my-services/:userId", async (req, res) => {
    const {userId} = req.params;
    const services = await prisma.myService.findMany({
      where: { userId: userId},
      include: {
        service: true,
        
        serviceBundle: {
            include: {
              services: true,
            },
          },
        application: {
          
            include:{
                applicationTrackStep:{
                  include: {
                    serviceDocument: true,
                  },
                },
                servicePeriod: {
                  include: {
                 // MUST exist in schema
                    periodStep: {
                      include: {
                        serviceDocument: true, // ✅ correct place
                      },
                    }
                  },
                },
                
            }
        }
        
      },
    });
  
    res.json({ success: true, services });
  });
  

  router.get("/applications", async (req, res) => {
    try {
      const applications = await prisma.application.findMany({
        orderBy: {
          createdAt: "desc",
        },                 
        select: {
          applicationId: true,
          status: true,
          createdAt: true,
                          
          service: {
            select: {
              name: true,
              serviceType: true,
            },
          },
  
          bundle: {
            select: {
              name: true,
            },
          },
  
          employee: {
            select: {
              name: true,
              photoUrl:true
            },
          },
  
          servicePeriod: {
            select: {
                periodStep: true, // only count purpose
            },
          },
        },
      });
     
  
      const formatted = applications.map((app) => ({
        applicationId: app.applicationId,
        serviceName: app.service?.name || app.bundle?.name,
        serviceType: app.service?.serviceType || "BUNDLE",
        status: app.status,
        createdAt: app.createdAt,
        employeePhoto :app.employee?.photoUrl || null,
        employeeName: app.employee?.name || null,
        totalPeriods: app.servicePeriod.length,
      }));
  
      res.json({
        success: true,
        applications: formatted,
      
      });
    } catch (error) {
      console.error("Get app list error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });
  
  router.get("/application/:applicationId", async (req, res) => {
    try {
      const { applicationId } = req.params;
  
      const application = await prisma.application.findUnique({
        where: { applicationId },
        include: {
          service: {
        
          },
          employee: {
            select: {
              employeeId: true,
              name: true,
            },
          },

             // 🟢 ONE-TIME SERVICE STEPS (important if not recurring)
        applicationTrackStep: {                 // 🟢 ADDED
            orderBy: { order: "asc" },            // 🟢 ADDED
          },
          servicePeriod: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
                periodStep: {              // 🟢 ADDED — this brings monthly steps
                  orderBy: { order: "asc" } // 🟢 ADDED — steps in correct order
                }
              }
          },
        },
      });
  
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }
  
      res.json({
        success: true,
        application,
      });
    } catch (error) {
      console.error("Get application detail error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });
  
  
  router.post("/application/start/apply/:myServiceId",applicationImgUpload.any(),
    async (req, res) => {
      try {
        const { myServiceId } = req.params;
        const { serviceId, ...restBody } = req.body;
  
        /* ---------------------------------------------------
         1️⃣ Validate serviceId
        --------------------------------------------------- */
        if (!serviceId) {
          return res.status(400).json({
            success: false,
            message: "serviceId is required",
          });
        }
  
        /* ---------------------------------------------------
         2️⃣ Validate MyService (must be purchased)
        --------------------------------------------------- */
        const myService = await prisma.myService.findUnique({
          where: { myServiceId },
        });
  
        if (!myService) {
          return res.status(404).json({
            success: false,
            message: "Service not purchased",
          });
        }
  
        const userId = myService.userId
        /* ---------------------------------------------------
         3️⃣ Prevent duplicate application
        --------------------------------------------------- */
        const existingApplication = await prisma.application.findUnique({
          where: { myServiceId },
        });
  
        if (existingApplication) {
          return res.status(400).json({
            success: false,
            message: "Application already submitted for this service",
          });
        }
  
        /* ---------------------------------------------------
         4️⃣ Validate service existence
        --------------------------------------------------- */
        const service = await prisma.service.findUnique({
          where: { serviceId },
        });

        
  
        if (!service) {
          return res.status(404).json({
            success: false,
            message: "Service not found",
          });
        }
  
        /* ---------------------------------------------------
         5️⃣ Ownership check (VERY IMPORTANT)
        --------------------------------------------------- */
        if (myService.serviceId !== serviceId) {
          return res.status(400).json({
            success: false,
            message: "Service does not match purchased service",
          });
        }
  
        /* ---------------------------------------------------
         6️⃣ Collect text inputs
        --------------------------------------------------- */
        let parsedFormData = { ...restBody };
  
        /* ---------------------------------------------------
         7️⃣ Attach uploaded files
        --------------------------------------------------- */
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            parsedFormData[file.fieldname] = {
              fileName: file.filename,
              sizeInMb: (file.size / (1024 * 1024)).toFixed(2),
              url: file.location,
            };
          });
        }

        /* ---------------------------------------------------
         8️⃣ Create Application (linked to MyService)
        --------------------------------------------------- */
        const application = await prisma.application.create({
          data: {
            myServiceId,
            serviceId,
            userId,
            formData: parsedFormData,
            status: "PENDING",
          },
        });

        // console.log("jarom",application)

        if (service.serviceType === "ONE_TIME") {
        const serviceSteps = await prisma.serviceTrackStep.findMany({
            where: { serviceId },
            orderBy: { order: "asc" },
            });
            
            
            if (serviceSteps.length > 0) {
            await prisma.applicationTrackStep.createMany({
            data: serviceSteps.map((step) => ({
            applicationId: application.applicationId,
            title: step.title,
            description: step.description,
            order: step.order,
            status: "PENDING",
            })),
            });
            }
        }
   

        /* ---------------------------------------------------
         9️⃣ Handle recurring service periods
        --------------------------------------------------- */
        if (service.serviceType === "RECURRING") {
          const periods = [];
          const startDate = new Date();
  
          let totalMonths =
            service.durationUnit === "YEAR"
              ? Number(service.duration) * 12
              : Number(service.duration);
  
          let monthGap = 0;
  
          switch (service.frequency) {
            case "MONTHLY":
              monthGap = 1;
              break;
            case "QUARTERLY":
              monthGap = 3;
              break;
            case "HALF_YEARLY":
              monthGap = 6;
              break;
            case "YEARLY":
              monthGap = 12;
              break;
            default:
              throw new Error("Invalid service frequency");
          }
  
          const totalPeriods = Math.ceil(totalMonths / monthGap);
  
          for (let i = 0; i < totalPeriods; i++) {
            const periodDate = new Date(
              startDate.getFullYear(),
              startDate.getMonth() + i * monthGap,
              1
            );
  
            const label = periodDate.toLocaleString("default", {
              month: "short",
              year: "numeric",
            });
  
            periods.push({
              applicationId: application.applicationId,
              periodLabel: label,
              startDate: periodDate,
              endDate: new Date(
              periodDate.getFullYear(),
              periodDate.getMonth() + monthGap,0),
              status: "PENDING",
              isLocked: i === 0 ? false : true,isLocked: i === 0 ? false : true,
            });
          }
  
          if (periods.length > 0) {
            await prisma.servicePeriod.createMany({ data: periods });
          }
        }
  
        /* ---------------------------------------------------
         🔟 Update MyService status
        --------------------------------------------------- */
        await prisma.myService.update({
          where: { myServiceId },
          data: { status: "IN_PROGRESS" },
        });

 // 2️⃣ Fetch them back (needed because createMany doesn't return IDs)
 const savedPeriods = await prisma.servicePeriod.findMany({
    where: { applicationId: application.applicationId },
  });

  // 3️⃣ Get step template
  const serviceSteps = await prisma.serviceTrackStep.findMany({
    where: { serviceId },
    orderBy: { order: "asc" },
  });

  // 4️⃣ Create PeriodSteps for EACH period
  for (const period of savedPeriods) {
    await prisma.periodStep.createMany({
      data: serviceSteps.map((step) => ({
        servicePeriodId: period.servicePeriodId,
        title: step.title,
        description: step.description,
        order: step.order,
        status: "PENDING",
      })),
    });
  }


  if (service.documentsRequired === "true") {
    console.log("📄 Auto Document Request Enabled");
  
    const periodSteps = await prisma.periodStep.findMany({
      where: { servicePeriod: { applicationId: application.applicationId }, order: 1 },
    });
  
    const requiredDocs = JSON.parse(service.requiredDocuments);
  

    const docsToCreate = [];
    for (const step of periodSteps) {
      for (const doc of requiredDocs) {
        docsToCreate.push({
          periodStepId: step.periodStepId,
          documentType: doc.documentName, // <- use documentName here
          inputType: doc.inputType,
          flow: "REQUESTED",
          status: "PENDING",
          requestedBy: "SYSTEM",
        });
      }
    }
  
    if (docsToCreate.length > 0) {
      await prisma.serviceDocument.createMany({ data: docsToCreate });
      console.log("✅ Documents auto-created");
    } else {
      console.log("⚠️ No required documents found for this service");
    }
  }

        
  
        /* ---------------------------------------------------
         ✅ Final Response
        --------------------------------------------------- */
        return res.status(201).json({
          success: true,
          message: "Application submitted successfully",
          application,
        });
      } catch (error) {
        console.error("Apply service error:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  );
  

// ithu vanthu mela erukaaa api panurathuku munadi panathu
//   router.post("/applications/start/apply/:myServiceId",applicationImgUpload.any(),async (req, res) => {
//       try {
//         const { serviceId, bundleId, ...restBody } = req.body;

//         const { myServiceId } = req.params;

// const myService = await prisma.myService.findUnique({
//   where: { myServiceId },
// });

// if (!myService) {
//   return res.status(404).json({
//     success: false,
//     message: "Service not purchased",
//   });
// }




       
  
//         if (!serviceId && !bundleId) {
//           return res.status(400).json({
//             success: false,
//             message: "Either serviceId or bundleId is required",
//           });
//         }
  
//         // text inputs like name, email, phone
//         let parsedFormData = { ...restBody };
  
//         // Attach uploaded files into formData
//         if (req.files && req.files.length > 0) {
//           req.files.forEach((file) => {
//             parsedFormData[file.fieldname] = {
//               fileName: file.filename,
//               sizeInMb: (file.size / (1024 * 1024)).toFixed(2),
//               url:file.location
//             };
//           });
//         }
  
//         // Validate service / bundle
//         let service = null;
//         let bundle = null;
  
//         if (serviceId) {
//           service = await prisma.service.findUnique({
//             where: { serviceId },
//           });
  
//           if (!service) {
//             return res
//               .status(404)
//               .json({ success: false, message: "Service not found" });
//           }
//         }
  
//         if (bundleId) {
//           bundle = await prisma.serviceBundle.findUnique({
//             where: { bundleId },
//           });
  
//           if (!bundle) {
//             return res
//               .status(404)
//               .json({ success: false, message: "Bundle not found" });
//           }
//         }
  
//         // Create Application
//         const application = await prisma.application.create({
//           data: {
//             serviceId: serviceId || null,
//             bundleId: bundleId || null,
//             formData: parsedFormData,
//             status: "PENDING",
//           },
//         });

//         console.log(application)

//         if (service) {
//             const serviceSteps = await prisma.serviceTrackStep.findMany({
//             where: {
//             serviceId: service.serviceId,
//             },
//             orderBy: {
//             order: "asc",
//             },
//             });
//             console.log(serviceSteps)
            
//             if (serviceSteps.length > 0) {
//             await prisma.applicationTrackStep.createMany({
//             data: serviceSteps.map((step) => ({
//             title: step.title,
//             description: step.description,
//             order: step.order,
//             applicationTrackStepId: application.applicationId,
//             status: "PENDING",
//             })),
//             });
//             }
//             }

  
// // Create recurring periods
// if (service && service.serviceType === "RECURRING") {
//     const periods = [];
//     const startDate = new Date();
  
//     // 1️⃣ Convert duration to total months
//     let totalMonths =
//       service.durationUnit === "YEAR"
//         ? service.duration * 12
//         : service.duration;
  
//     // 2️⃣ Frequency → month gap
//     let monthGap = 0;
  
//     switch (service.frequency) {
//       case "MONTHLY":
//         monthGap = 1;
//         break;
//       case "QUARTERLY":
//         monthGap = 3;
//         break;
//       case "HALF_YEARLY":
//         monthGap = 6;
//         break;
//       case "YEARLY":
//         monthGap = 12;
//         break;
//       default:
//         throw new Error("Invalid service frequency");
//     }
  
//     // 3️⃣ Total number of periods
//     const totalPeriods = Math.ceil(totalMonths / monthGap);
  
//     // 4️⃣ Create periods
//     for (let i = 0; i < totalPeriods; i++) {
//       const periodDate = new Date(
//         startDate.getFullYear(),
//         startDate.getMonth() + i * monthGap,
//         1
//       );
  
//       const label = periodDate.toLocaleString("default", {
//         month: "short",
//         year: "numeric",
//       });
  
//       periods.push({
//         applicationId: application.applicationId,
//         periodLabel: label,
//         status: "PENDING",
//       });
//     }
  
//     // 5️⃣ Save to DB
//     if (periods.length > 0) {
//       await prisma.servicePeriod.createMany({ data: periods });
//     }
//   }
  


//         return res.status(201).json({
//           success: true,
//           message: "Application submitted successfully",
//           application,
//         });
//       } catch (error) {
//         console.error("Apply service error:", error);
//         return res.status(500).json({
//           success: false,
//           message: "Internal server error",
//         });
//       }
//     }
//   );



  router.post("/admin/applications/:applicationId/assign",async (req, res) => {
      try {
        const { applicationId } = req.params;
        const { employeeId, adminNote } = req.body;
  
        // 1️⃣ Basic validation
        if (!employeeId) {
          return res.status(400).json({
            success: false,
            message: "employeeId is required",
          });
        }
  
        // 2️⃣ Update application
        const application = await prisma.application.update({
          where: { applicationId },
          data: {
            employeeId,
            adminNote,
            status: "ASSIGNED",
          },
        });
  
        res.json({
          success: true,
          message: "Application assigned to staff successfully",
          application,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Failed to assign application",
        });
      }
    }
  );


  router.get("/admin/employees/assignable", async (req, res) => {
    try {
      const { search = "" } = req.query;
  
      const whereCondition = {
        status: "ACTIVE",
        role: "STAFF",
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              employeeId: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              department: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        }),
      };
  
      const employees = await prisma.employee.findMany({
        where: whereCondition,
        select: {
          employeeId: true,
          name: true,
          email: true,
          photoUrl: true,
          department: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
  
      res.json({
        success: true,
        data: employees,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });


//Staff
  
  router.get("/staff/:employeeId/applications", async (req, res) => {
    try {
      const { employeeId } = req.params;
  
      const applications = await prisma.application.findMany({
        where: {
          employeeId: employeeId,   // ✅ THIS IS THE KEY FIX
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          applicationId: true,
          status: true,
          createdAt: true,
  
          service: {
            select: {
              name: true,
              serviceType: true,
            },
          },
  
          bundle: {
            select: {
              name: true,
            },
          },
  

  
          servicePeriod: {
            select: {
                servicePeriodId: true,
            },
          },
        },
      });
  
      const formatted = applications.map((app) => ({
        applicationId: app.applicationId,
        serviceName: app.service?.name || app.bundle?.name || "N/A",
        serviceType: app.service?.serviceType || "BUNDLE",
        status: app.status,
        createdAt: app.createdAt,
  
      
  
        totalPeriods: app.servicePeriod.length || null,
      }));
  
      res.json({
        success: true,
        applications: formatted,
      });
    } catch (error) {
      console.error("Get staff applications error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });


  router.get("/staff/:employeeId/application/:applicationId", async (req, res) => {
    try {
      const { employeeId, applicationId } = req.params;
  
      const application = await prisma.application.findFirst({
        where: {
          applicationId,
          employeeId, // ✅ IMPORTANT CHECK
        },
        include: {
          service: true,
          
          bundle: true,
  // 🔥 IMPORTANT: STEP TRACKING
  applicationTrackStep: {
    orderBy: {
    order: "asc",
    },
    },
          
  
          servicePeriod: {
            orderBy: {
              createdAt: "asc",
            },  
            include: { // 🟢 ADDED (so staff sees monthly steps)
                periodStep: {
                  orderBy: { order: "asc" },
                  include: {
                    // 🔥 PERIOD STEP KULLA SERVICE DOCUMENT
                    serviceDocument: true,
                  },
                }, 
             
              },
              
          },
        },
      });
  
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found or access denied",
        });
      }
  
      res.json({
        success: true,
        application,
      });
    } catch (error) {
      console.error("Get application detail error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });
  
  
  router.put("/staff/update/step", async (req, res) => {
    try {
      const {
        applicationTrackStepId,
        periodStepId,
        status,
        description,
        remarks,
      } = req.body;
  
      // must send at least one id
      if (!applicationTrackStepId && !periodStepId) {
        return res.status(400).json({
          success: false,
          message: "Step ID is required",
        });
      }

  
      let updatedStep;
  
      // ===============================
      // 🟢 ONE-TIME STEP UPDATE
      // ===============================
      if (applicationTrackStepId) {
        updatedStep = await prisma.applicationTrackStep.update({
          where: { applicationTrackStepId },
          data: {
            status: status,
            description,
            remarks,
            updatedAt: new Date(),
          },
        });
      }
  
      // ===============================
      // 🔵 PERIOD STEP UPDATE
      // ===============================
      if (periodStepId) {
        
        updatedStep = await prisma.periodStep.update({
          where: { periodStepId },
          data: {
            status: status,
            description,
            remarks,
            updatedAt: new Date(),
          },
          select: {
            periodStepId: true,
            servicePeriodId: true,
          },
        });
  
        const servicePeriodId = updatedStep.servicePeriodId;
  
        // ---------- calculate progress ----------
        const totalSteps = await prisma.periodStep.count({
          where: { servicePeriodId },
        });
  
        const completedSteps = await prisma.periodStep.count({
          where: {
            servicePeriodId,
            status: "COMPLETED",
          },
        });
  
  
        const percentage = totalSteps === 0 ? 0  : Math.round((completedSteps / totalSteps) * 100);
  
        // ---------- decide period status ----------
        let periodStatus = "PENDING";
        if (percentage === 100) periodStatus = "COMPLETED";
        else if (percentage > 0) periodStatus = "PROCESSING";
  
        // ---------- update parent period ----------
        await prisma.servicePeriod.update({
          where: { servicePeriodId },
          data: {
            completionPercent: percentage,
            status: periodStatus,
          },
        });
      }
  
      return res.json({
        success: true,
        message: "Step updated successfully",
        step: updatedStep,
      });
  
    } catch (error) {
      console.error("Step update error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to update step",
      });
    }
  });
  
   
//CHUMAA EADUTHU VACHU ERUKEN
  // router.put("/staff/update/step", async (req, res) => {
  //   try {
  //     const {
  //       applicationTrackStepId,
  //       periodStepId,
  //       status,
  //       description,
  //       remarks,
  //     } = req.body;
  
  //     // ❌ Must provide at least one step ID
  //     if (!applicationTrackStepId && !periodStepId) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Step ID is required",
  //       });
  //     }
  
  //     let updatedStep;
  
  //     // 🟢 ONE-TIME STEP UPDATE
  //     if (applicationTrackStepId) {
  //       updatedStep = await prisma.applicationTrackStep.update({
  //         where: { applicationTrackStepId },
  //         data: {
  //           status,
  //           description,
  //           remarks,
  //           updatedAt: new Date(),
  //         },
  //       });
  //     }
  
  //     // 🔵 RECURRING PERIOD STEP UPDATE
  //     if (periodStepId) {
  //       updatedStep = await prisma.periodStep.update({
  //         where: { periodStepId },
  //         data: {
  //           status,
  //           description,
  //           remarks,
  //           updatedAt: new Date(),
  //         },
  //         select: {
  //           periodStepId: true,
  //           servicePeriodId: true,
  //         },
  //       });
  //     }

  //   console.log(updatedStep)

  //   const totalSteps = await prisma.periodStep.count({
  //     where: {servicePeriodId : updatedStep.servicePeriodId },
  //   });

    

  //   console.log(totalSteps)
  
  //     return res.json({
  //       success: true,
  //       message: "Step updated successfully",
  //       step: updatedStep,
  //     });
  //   } catch (error) {
  //     console.error("Step update error:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Unable to update step",
  //     });
  //   }
  // });
  

//document request
// ------------------------------
// 1️⃣ Staff requests a document (text or file)
// ------------------------------
// router.post("/staff/request-document", async (req, res) => {
//   try {
//     const {
//       applicationTrackStepId,
//       servicePeriodId,
//       requestedBy,
//       documentType,
//       remark,
//       inputType 
//     } = req.body;

//     // ✅ Must provide ONE parent
//     if (!applicationTrackStepId && !servicePeriodId) {
//       return res.status(400).json({
//         success: false,
//         message: "applicationTrackStepId OR servicePeriodId required"
//       });
//     }

//     // ❌ Prevent both at same time (clean DB design)
//     if (applicationTrackStepId && servicePeriodId) {
//       return res.status(400).json({
//         success: false,
//         message: "Provide only one parent id"
//       });
//     }

//      // ✅ Validate input type
//      if (!["FILE","TEXT"].includes(inputType)) {
//       return res.status(400).json({
//         success:false,
//         message:"inputType must be FILE, TEXT"
//       });
//     }

//     const doc = await prisma.serviceDocument.create({
//       data: {
//         applicationTrackStepId,
//         servicePeriodId,
//         requestedBy,
//         documentType,
//         remark,
//         inputType,     
//         status: "PENDING",
//         version: 0,
//         flow: "REQUESTED", // 🟢 ADD
//       }
//     });

//     res.json({ success: true, document: doc });

//   } catch (error) {
//     console.error("Request document error:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// router.get("/user/:applicationTrackStepId/documents", async (req, res) => {
//   try {
//     const { applicationTrackStepId } = req.params;

//     const docs = await prisma.serviceDocument.findMany({
//       where: {
//         applicationTrackStepId,
//         status: "PENDING",
//         flow: "REQUESTED",   // 🟢 ADD
//       },
//       orderBy: { createdAt: "asc" },
//     });

//     res.json({ success: true, documents: docs });
//   } catch (error) {
//     console.error("Get pending documents error:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });
// ------------------------------
// 2️⃣ User submits document or text
// ------------------------------


router.put("/user/upload-document/:documentId",myDocuments.single("file"), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { textValue } = req.body;

    const fileUrl = req.file?.location || null;

    if (!fileUrl && !textValue) {
      return res.status(400).json({
        success: false,
        message: "fileUrl or textValue required"
      });
    }

    const existing = await prisma.serviceDocument.findUnique({
      where: { documentId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

   

    // optional: lock verified docs
    if (existing.status === "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Verified document cannot be modified"
      });
    }

   

    const doc = await prisma.serviceDocument.update({
      where: { documentId },
      data: {
        fileUrl,
        textValue,
        uploadedBy: "user",
        version: { increment: 1 },
        status: "FOR_REVIEW", // waiting for staff verification
      },
    });

    res.json({ success: true, document: doc });
  } catch (error) {
    console.error("User upload document error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// ------------------------------
// 3️⃣ Staff verifies or rejects document/text
// ------------------------------
router.put("/staff/review-document/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, remark } = req.body; // VERIFIED or REJECTED

    if (!["VERIFIED", "REJECTED","FOR_REVIEW"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    
    const existing = await prisma.serviceDocument.findUnique({
      where: { documentId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }


    if (!existing.fileUrl && !existing.textValue) {
      return res.status(400).json({
        success: false,
        message: "User has not uploaded document yet"
      });
    }

    const doc = await prisma.serviceDocument.update({
      where: { documentId },
      data: { status, remark, uploadedBy:"staff" },
    });

    res.json({ success: true, document: doc });
  } catch (error) {
    console.error("Review document error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});





// =======================================================
// 6️⃣ 🟢 NEW — User downloads issued documents
// =======================================================
// router.get(
//   "/user/:applicationTrackStepId/issued-documents",
//   async (req, res) => {
//     const { applicationTrackStepId } = req.params;

//     const docs = await prisma.serviceDocument.findMany({
//       where: {
//         applicationTrackStepId,
//         flow: "ISSUED"
//       },
//       orderBy: { createdAt: "desc" }
//     });

//     res.json({ success: true, documents: docs });
//   }
// );

// ------------------------------
// 4️⃣ Optional: List all document requests for an application
// ------------------------------



router.get("/application/:applicationId/documents", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const docs = await prisma.serviceDocument.findMany({
      where: {
        OR: [
          // Track step documents
          {
            applicationTrackStep: {
              applicationId: applicationId,
            },
          },

          // Period step documents
          {
            periodStep: {
              servicePeriod: {
                applicationId: applicationId,
              },
            },
          },
        ],
      },
      include: {
        applicationTrackStep: true,
        periodStep: true,
      },
      orderBy: [
        { flow: "asc" },
        { createdAt: "asc" },
      ],
    });

    res.json({ success: true, documents: docs });
  } catch (error) {
    console.error("List documents error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/staff/document",myDocuments.single("file"),async (req, res) => {
    try {
      const {
        applicationTrackStepId,
        periodStepId,
        documentType,
        remark,
        inputType,
        requestedBy,
        issuedBy,
        flow // REQUESTED | ISSUED
      } = req.body;

      const fileUrl = req.file?.location;

      // ✅ parent check
      if (!applicationTrackStepId && !periodStepId) {
        return res.status(400).json({
          success: false,
          message: "Provide applicationTrackStepId OR periodStepId"
        });
      }

      if (applicationTrackStepId && periodStepId) {
        return res.status(400).json({
          success: false,
          message: "Provide only one parent id"
        });
      }

      // ✅ input type check
      if (!["FILE", "TEXT"].includes(inputType)) {
        return res.status(400).json({
          success: false,
          message: "inputType must be FILE or TEXT"
        });
      }

      // ✅ flow check
      if (!["REQUESTED", "ISSUED"].includes(flow)) {
        return res.status(400).json({
          success: false,
          message: "flow must be REQUESTED or ISSUED"
        });
      }

      // ------------------------
      // REQUEST DOCUMENT
      // ------------------------
      if (flow === "REQUESTED") {
        const doc = await prisma.serviceDocument.create({
          data: {
            applicationTrackStepId,
            periodStepId,
            documentType,
            remark,
            inputType,
            requestedBy,
            flow: "REQUESTED",
            status: "PENDING",
            version: 0
          }
        });

        return res.json({ success: true, document: doc });
      }

      // ------------------------
      // ISSUE DOCUMENT
      // ------------------------
      if (flow === "ISSUED") {
        const doc = await prisma.serviceDocument.create({
          data: {
            applicationTrackStepId,
            periodStepId,
            documentType,
            remark,
            inputType,
            fileUrl,
            requestedBy: issuedBy,
            uploadedBy: "staff",
            flow: "ISSUED",
            status: "VERIFIED",
            version: 1
          }
        });

        return res.json({ success: true, document: doc });
      }

    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false });
    }
  }
);



module.exports = router