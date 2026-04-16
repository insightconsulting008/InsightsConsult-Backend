const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const {serviceImgUpload} = require("../../utils/multer")
const {deleteS3Object} = require("../../utils/deleteS3Object")
 
// =============================
// GET ALL SERVICES WITH INPUTFIELDS + TRACKSTEPS
// =============================

    
// router.get("/analatic", async (req, res) => {
    //   try {
    
    //     const { filter } = req.query;
    //     const now = new Date();
    
    //     let dateFilter = {};
    
    //     // 📅 FILTER LOGIC
    //     if (filter === "day") {
    //       const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    //       dateFilter = { gte: startOfDay };
    //     }
    
    //     if (filter === "month") {
    //       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    //       dateFilter = { gte: startOfMonth };
    //     }
    
    //     if (filter === "year") {
    //       const startOfYear = new Date(now.getFullYear(), 0, 1);
    //       dateFilter = { gte: startOfYear };
    //     }
    
    //     // 🚀 PARALLEL FETCH
    //     const [
    //       payments,
    //       users,
    //       applications,
    //       totalUsers,
    //       totalStaff
    //     ] = await Promise.all([
    //       prisma.payment.findMany({
    //         where: {
    //           status: "PAID",
    //           ...(filter && { createdAt: dateFilter })
    //         }
    //       }),
    //       prisma.user.findMany({
    //         include: {
    //           payments: { where: { status: "PAID" } }
    //         }
    //       }),
    //       prisma.application.findMany({
    //         where: {
    //           ...(filter && { createdAt: dateFilter })
    //         },
    //         include: { service: true }
    //       }),
    //       prisma.user.count(),
    //       prisma.employee.count({
    //         where: { role: "STAFF" }
    //       })
    //     ]);
    
    //     // 💰 TOTAL REVENUE
    //     const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    
    //     // 🔁 REPEAT USERS
    //     const repeatUsersList = users
    //       .filter(u => u.payments.length > 1)
    //       .map(u => ({
    //         userId: u.userId,
    //         name: u.name,
    //         email: u.email,
    //         totalPayments: u.payments.length,
    //         totalSpent: u.payments.reduce((sum, p) => sum + p.amount, 0)
    //       }))
    //       .sort((a, b) => b.totalSpent - a.totalSpent);
    
    //     const repeatUsers = repeatUsersList.length;
    
    //     // 🔥 TOP SERVICES (TOP 3)
    //     const serviceCountMap = {};
    
    //     applications.forEach(app => {
    //       if (!app.serviceId) return;
    
    //       if (!serviceCountMap[app.serviceId]) {
    //         serviceCountMap[app.serviceId] = {
    //           name: app.service?.name || "Unknown",
    //           count: 0
    //         };
    //       }
    
    //       serviceCountMap[app.serviceId].count += 1;
    //     });
    
    //     const topServices = Object.values(serviceCountMap)
    //       .sort((a, b) => b.count - a.count)
    //       .slice(0, 3);
    
    //     // 👤 USER ACTIVITY (VERY IMPORTANT)
    //     const userActivity = users.map(u => ({
    //       userId: u.userId,
    //       name: u.name,
    //       lastPaymentDate: u.payments.length
    //         ? u.payments[u.payments.length - 1].createdAt
    //         : null,
    //       totalPayments: u.payments.length
    //     }));
    
    //     // classify activity
    //     const activeUsers = userActivity.filter(u => u.totalPayments > 0).length;
    //     const inactiveUsers = userActivity.filter(u => u.totalPayments === 0).length;
    
    //     res.json({
    //       totalRevenue,
    //       totalUsers,
    //       totalStaff,
    
    //       repeatUsers,
    //       repeatUsersList,
    
    //       topServices,
    
    //       userActivitySummary: {
    //         activeUsers,
    //         inactiveUsers
    //       },
    
    //       userActivity // detailed list (optional for table)
    //     });
    
    //   } catch (err) {
    //     console.error(err);
    //     res.status(500).json({ error: "Dashboard failed" });
    //   }
    // });
  // =============================
  // CREATE SERVICE
  // =============================
  

router.post("/",serviceImgUpload.single('photoUrl') ,async (req, res) => {
      try {
        const {  name, description, serviceType, frequency, duration, durationUnit,
          individualPrice, offerPrice, isGstApplicable, gstPercentage, finalIndividualPrice,
          subCategoryId, employeeId , requiredDocuments ,documentsRequired,points } = req.body;
        const photoUrl = req.file.location 
         
      
        const service = await prisma.service.create({
          data: { name, description, photoUrl, serviceType, frequency, duration, durationUnit, individualPrice,
              offerPrice, isGstApplicable, gstPercentage, finalIndividualPrice, subCategoryId, employeeId , 
              requiredDocuments,documentsRequired,  points: JSON.parse(points)},
        });
    
        res.json({ success: true, service });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  
router.post("/:serviceId/input-fields", async (req, res) => {
      try {
        const { serviceId } = req.params;
        const { fields } = req.body; // array: [{ label, type, placeholder, required, masterFieldId }]
        console.log(fields)
        const createdFields = [];
    
        for (const f of fields) {
    
          let masterField;
    
          // -----------------------------------------
          // CASE 1: masterFieldId is given → use it
          // -----------------------------------------
          if (f.masterFieldId) {
            masterField = await prisma.masterInputField.findUnique({
              where: { masterFieldId: f.masterFieldId }
            });
    
            if (!masterField) {
              return res.status(400).json({
                success: false,
                message: `Master field not found: ${f.masterFieldId}`
              });
            }
          }
    
          // -----------------------------------------
          // CASE 2: No masterFieldId → create new Master input field
          // -----------------------------------------
          if (!masterField) {
            masterField = await prisma.masterInputField.create({
              data: {
                label: f.label,
                type: f.type,
                options: f.options || null,
                placeholder: f.placeholder || "",
                required: f.required ?? false,
              },
            });
          }
    
          // -----------------------------------------
          // CREATE SERVICE INPUT FIELD (always)
          // -----------------------------------------
          const created = await prisma.serviceInputField.create({
            data: {
              label: masterField.label,
              type: masterField.type,
              placeholder: masterField.placeholder,
              required: f.required ?? false,
              options: f.options,
              masterFieldId: masterField.masterFieldId,
              serviceId,
            },
          });
    
          createdFields.push(created);
        }
    
        res.json({ success: true, createdFields });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });  
    // =============================
    // ADD TRACK STEP TO SERVICE
    // =============================
    // 
router.post("/:serviceId/track-steps", async (req, res) => {
      try {
        const { serviceId } = req.params;
        const { steps } = req.body; // array of steps
    
        const result = await prisma.$transaction(
          steps.map((step) =>
            prisma.serviceTrackStep.create({
              data: {
                title: step.title,
                order: step.order,
                description: step.description,
                serviceId
              }
            })
          )
        );
    
        res.json({
          success: true,
          message: "Track steps created successfully",
          steps: result
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });


router.put("/:serviceId",serviceImgUpload.single("photoUrl"),
  async (req, res) => {
    try {
      const { serviceId } = req.params;
      const {
        name,
        description,
        serviceType,
        frequency,
        duration,
        durationUnit,
        individualPrice,
        offerPrice,
        isGstApplicable,
        gstPercentage,
        finalIndividualPrice,
        subCategoryId,
        employeeId,
        requiredDocuments,
        documentsRequired,
        points,
      } = req.body;

      // ✅ get existing service (for old image)
      const existingService = await prisma.service.findUnique({
        where: { serviceId },
      });

      if (!existingService) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      // ✅ handle image update
      let photoUrl = existingService.photoUrl;

      if (req.file) {
        photoUrl = req.file.location;
        await deleteS3Object(existingService.photoUrl);
      }

      const updatedService = await prisma.service.update({
        where: { serviceId },
        data: {
          name,
          description,
          photoUrl,
          serviceType,
          frequency,
          duration,
          durationUnit,
          individualPrice,
          offerPrice,
          isGstApplicable,
          gstPercentage,
          finalIndividualPrice,
          subCategoryId,
          employeeId,
          requiredDocuments,
          documentsRequired,
          points: points ? JSON.parse(points) : undefined,
        },
      });

      res.json({
        success: true,
        message: "Service updated successfully",
        service: updatedService,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

router.put("/:serviceId/input-fields", async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { fields } = req.body;

    // ✅ delete old fields
    await prisma.serviceInputField.deleteMany({
      where: { serviceId },
    });

    const createdFields = [];

    for (const f of fields) {
      let masterField;

      // CASE 1: use existing master
      if (f.masterFieldId) {
        masterField = await prisma.masterInputField.findUnique({
          where: { masterFieldId: f.masterFieldId },
        });

        if (!masterField) {
          return res.status(400).json({
            success: false,
            message: `Master field not found: ${f.masterFieldId}`,
          });
        }
      }

      // CASE 2: create new master
      if (!masterField) {
        masterField = await prisma.masterInputField.create({
          data: {
            label: f.label,
            type: f.type,
            options: f.options || null,
            placeholder: f.placeholder || "",
            required: f.required ?? false,
          },
        });
      }

      const created = await prisma.serviceInputField.create({
        data: {
          label: masterField.label,
          type: masterField.type,
          placeholder: masterField.placeholder,
          required: f.required ?? false,
          options: f.options,
          masterFieldId: masterField.masterFieldId,
          serviceId,
        },
      });

      createdFields.push(created);
    }

    res.json({
      success: true,
      message: "Input fields updated",
      createdFields,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:serviceId/track-steps", async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { steps } = req.body;

    // ✅ delete old steps
    await prisma.serviceTrackStep.deleteMany({
      where: { serviceId },
    });

    const result = await prisma.$transaction(
      steps.map((step) =>
        prisma.serviceTrackStep.create({
          data: {
            title: step.title,
            order: step.order,
            description: step.description,
            serviceId,
          },
        })
      )
    );

    res.json({
      success: true,
      message: "Track steps updated successfully",
      steps: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/:serviceId", async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { confirmName } = req.body;

    // ✅ check if service exists
    const existingService = await prisma.service.findUnique({
      where: { serviceId },
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

      // 🔴 MAIN SECURITY CHECK
      if (existingService.name !== confirmName) {
        return res.status(400).json({
          success: false,
          message: "Service name does not match. Delete cancelled.",
        });
      }

    // ✅ OPTIONAL: delete S3 image
    // if (existingService.photoUrl) {
    //   await deleteS3Object(existingService.photoUrl);
    // }

    // ✅ TRANSACTION (VERY IMPORTANT)
    await prisma.$transaction([
      // 1️⃣ delete input fields
      prisma.serviceInputField.deleteMany({
        where: { serviceId },
      }),

      // 2️⃣ delete track steps
      prisma.serviceTrackStep.deleteMany({
        where: { serviceId },
      }),

      // 3️⃣ delete service itself
      prisma.service.delete({
        where: { serviceId },
      }),
    ]);

    res.json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

    


module.exports = router;
    