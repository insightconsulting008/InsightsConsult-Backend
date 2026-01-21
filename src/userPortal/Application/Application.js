const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const config = require("../../utils/config")
const {applicationImgUpload} = require('../../utils/multer')
const{ authenticate,authorizeRoles } = require("../../authMiddleware/authMiddleware")


router.post("/buy/service", async (req, res) => {
    try {
      const { userId, serviceId, bundleId } = req.body;
  
      /* ---------------------------------------------------
       1️⃣ Validation
      --------------------------------------------------- */
      if ((!serviceId && !bundleId) || (serviceId && bundleId)) {
        return res.status(400).json({
          success: false,
          message: "Provide either serviceId or bundleId",
        });
      }
  
      /* ---------------------------------------------------
       2️⃣ Buy Single Service
      --------------------------------------------------- */
      if (serviceId) {
        const service = await prisma.service.findUnique({
          where: { serviceId },
        });
  
        if (!service) {
          return res.status(404).json({
            success: false,
            message: "Service not found",
          });
        }
  
        const myService = await prisma.myService.create({
          data: {
            userId,
            serviceId,
            status: "NOT_STARTED",
          },
        });
  
        return res.json({
          success: true,
          message: "Service purchased successfully",
          myServices: [myService],
        });
      }
  
      /* ---------------------------------------------------
       3️⃣ Buy Bundle → Unlock all services
      --------------------------------------------------- */
      if (bundleId) {
        const bundle = await prisma.serviceBundle.findUnique({
          where: { bundleId },
          include: { services: true },
        });
  
        if (!bundle) {
          return res.status(404).json({
            success: false,
            message: "Bundle not found",
          });
        }
  
        // 🔑 Create MyService entry for EACH service
        const myServicesData = bundle.services.map((service) => ({
          userId,
          serviceId: service.serviceId,
          bundleId,
          status: "NOT_STARTED",
        }));
  
        const myServices = await prisma.myService.createMany({
          data: myServicesData,
        });
  
        return res.json({
          success: true,
          message: "Bundle purchased. All services unlocked.",
          unlockedServicesCount: bundle.services.length,
        });
      }
    } catch (error) {
      console.error("Buy service error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });
  

router.get("/my-services/:userId", async (req, res) => {
    const {userId} = req.params;
    const services = await prisma.myService.findMany({
      where: { userId: userId},
      include: {
        service: true,
        include: {
            ServiceInputField: true,
          },
        
        serviceBundle: {
            include: {
              services: true,
            },
          },
        application: true,
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
    "/application/start/apply/:myServiceId",
    applicationImgUpload.any(),
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
            formData: parsedFormData,
            status: "PENDING",
          },
        });
  
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
              status: "PENDING",
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
  


  router.post(
    "/applications/start/apply/:myServiceId",
    applicationImgUpload.any(),
    async (req, res) => {
      try {
        const { serviceId, bundleId, ...restBody } = req.body;

        const { myServiceId } = req.params;

const myService = await prisma.myService.findUnique({
  where: { myServiceId },
});

if (!myService) {
  return res.status(404).json({
    success: false,
    message: "Service not purchased",
  });
}

       
  
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



  router.post(
    "/admin/applications/:applicationId/assign",
    async (req, res) => {
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
  



  
  
  
  
  
  
  
  
  
  



  

module.exports = router