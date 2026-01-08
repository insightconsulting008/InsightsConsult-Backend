const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const config = require("../../utils/config")
const {applicationImgUpload} = require('../../utils/multer')

const{ authenticate,authorizeRoles } = require("../../authMiddleware/authMiddleware")


router.post("/buy/service", async (req, res) => {
    const { userId, serviceId, bundleId } = req.body;
  
    const myService = await prisma.myService.create({
      data: {
        userId,
        serviceId,
        bundleId,
        status: "NOT_STARTED",
      },
    });
  
    res.json({ success: true, myService });
});

router.get("/my-services/:userId", async (req, res) => {
    const services = await prisma.myService.findMany({
      where: { userId: req.params.userId },
      include: {
        service: true,
        bundle: { include: { services: true } },
        application: true,
      },
    });
  
    res.json({ success: true, services });
  });
  


  router.get("/application", async (req, res) => {
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
            },
          },
  
          servicePeriod: {
            select: {
              periodId: true, // only count purpose
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
          bundle: true,
          employee: {
            select: {
              employeeId: true,
              name: true,
            },
          },
          servicePeriod: {
            orderBy: {
              createdAt: "asc",
            },
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
  
  


  router.post(
    "/applications/apply",
    applicationImgUpload.any(),
    async (req, res) => {
      try {
        const { serviceId, bundleId, ...restBody } = req.body;

       
  
        if (!serviceId && !bundleId) {
          return res.status(400).json({
            success: false,
            message: "Either serviceId or bundleId is required",
          });
        }
  
        // text inputs like name, email, phone
        let parsedFormData = { ...restBody };
  
        // Attach uploaded files into formData
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            parsedFormData[file.fieldname] = {
              fileName: file.filename,
              sizeInMb: (file.size / (1024 * 1024)).toFixed(2),
              url:file.location
            };
          });
        }
  
        // Validate service / bundle
        let service = null;
        let bundle = null;
  
        if (serviceId) {
          service = await prisma.service.findUnique({
            where: { serviceId },
          });
  
          if (!service) {
            return res
              .status(404)
              .json({ success: false, message: "Service not found" });
          }
        }
  
        if (bundleId) {
          bundle = await prisma.serviceBundle.findUnique({
            where: { bundleId },
          });
  
          if (!bundle) {
            return res
              .status(404)
              .json({ success: false, message: "Bundle not found" });
          }
        }
  
        // Create Application
        const application = await prisma.application.create({
          data: {
            serviceId: serviceId || null,
            bundleId: bundleId || null,
            formData: parsedFormData,
            status: "PENDING",
          },
        });
  
// Create recurring periods
if (service && service.serviceType === "RECURRING") {
    const periods = [];
    const startDate = new Date();
  
    // 1️⃣ Convert duration to total months
    let totalMonths =
      service.durationUnit === "YEAR"
        ? service.duration * 12
        : service.duration;
  
    // 2️⃣ Frequency → month gap
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
  
    // 3️⃣ Total number of periods
    const totalPeriods = Math.ceil(totalMonths / monthGap);
  
    // 4️⃣ Create periods
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
        status: "PENDING",
      });
    }
  
    // 5️⃣ Save to DB
    if (periods.length > 0) {
      await prisma.servicePeriod.createMany({ data: periods });
    }
  }
  


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
  
  


// router.post("/applications/apply", applicationImgUpload.any() ,async (req, res) => {
//     try {
//       const {
//         //  userId,
//          serviceId, bundleId, formData } = req.body;
  
//     //   if (!userId) {
//     //     return res.status(400).json({ success: false, message: "userId is required" });
//     //   }
  
//       if (!serviceId && !bundleId) {
//         return res.status(400).json({
//           success: false,
//           message: "Either serviceId or bundleId must be provided",
//         });
//       }
  
//       // Fetch service or bundle details
//       let service = null;
//       let bundle = null;
  
//       if (serviceId) {
//         service = await prisma.service.findUnique({
//           where: { serviceId },
//         });
  
//         if (!service) {
//           return res.status(404).json({ success: false, message: "Service not found" });
//         }
//       }
  
//       if (bundleId) {
//         bundle = await prisma.serviceBundle.findUnique({
//           where: { bundleId },
//         });
  
//         if (!bundle) {
//           return res.status(404).json({ success: false, message: "Bundle not found" });
//         }
//       }
  
//       // Create Application
//       const application = await prisma.application.create({
//         data: {
//           serviceId: serviceId,
//           bundleId: bundleId, 
//           formData: formData,
//           status: "PENDING",
 
//         },
//       });
  
//       // If service is recurring, create ServicePeriods
//       if (service && service.serviceType === "RECURRING") {
//         const periods = [];
//         const startDate = new Date();
  
//         for (let i = 0; i < (service.duration || 0); i++) {
//           let periodDate;
  
//           if (service.frequency === "MONTHLY") {
//             periodDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
//           } else if (service.frequency === "QUARTERLY") {
//             periodDate = new Date(startDate.getFullYear(), startDate.getMonth() + i * 3, 1);
//           } else if (service.frequency === "YEARLY") {
//             periodDate = new Date(startDate.getFullYear() + i, 0, 1);
//           } else {
//             // Default monthly if frequency missing
//             periodDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
//           }
  
//           const label = periodDate.toLocaleString("default", {
//             month: "short",
//             year: "numeric",
//           });
  
//           periods.push({
//             applicationId: application.applicationId,
//             periodLabel: label,
//             status: "PENDING",
//           });
//         }
  
//         if (periods.length > 0) {
//           await prisma.servicePeriod.createMany({
//             data: periods,
//           });
//         }
//       }
  
//       return res.status(201).json({
//         success: true,
//         message: "Application created successfully",
//         application,
//       });
//     } catch (error) {
//       console.error("Apply service error:", error);
//       return res.status(500).json({ success: false, message: "Internal server error" });
//     }
//   });
  

module.exports = router