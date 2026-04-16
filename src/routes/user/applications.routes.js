const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const {applicationImgUpload} = require('../../utils/multer')
const {logHistory} = require("../../../src/utils/historyService")
const { generateReminders } = require("../../utils/reminderGenerator");

router.post("/start/apply/:myServiceId",applicationImgUpload.any(),
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
      include: { service: true }, // 🔥 IMPORTANT
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

    console.log("jaromjery-service",service)
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

              // 🔥 SNAPSHOT (CRITICAL)
      serviceName: service.name,
      serviceDescription: service.description,
      servicePhoto: service.photoUrl,

      serviceType: service.serviceType,
      frequency: service.frequency,
      duration: service.duration,
      durationUnit: service.durationUnit,

      offerPrice: service.offerPrice,
      isGstApplicable: service.isGstApplicable,
      gstPercentage: service.gstPercentage,
      finalPrice: service.finalIndividualPrice,
      },
    });

    console.log("jaromjery",application)

    await logHistory({
      applicationId: application.applicationId,
      action: "APPLICATION_CREATED",
      newValue: "PENDING",
      doneByRole: "USER",
      doneById: userId,
      message: "Application submitted by user",
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
          isLocked: i === 0 ? false : true,
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

    if (service.serviceType === "RECURRING") {
      await generateReminders(myService);
    }


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


if (savedPeriods.length > 0 && serviceSteps.length > 0) {
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


module.exports = router