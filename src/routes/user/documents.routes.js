const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const config = require("../../utils/config")
const {applicationImgUpload,myDocuments} = require('../../utils/multer')
const{ authenticate,authorizeRoles } = require("../../authMiddleware/authMiddleware")
const Razorpay = require("razorpay");
const crypto = require("crypto");
const {logHistory} = require("../../../src/utils/historyService")
const {createNotification} = require("../../notifications/notificationService")
const { generateReminders } = require("../../utils/reminderGenerator");

router.put("/:documentId",myDocuments.single("file"), async (req, res) => {
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
      where: { documentId },
      include: {
        periodStep: {
          include: {
            servicePeriod: true,
          },
        },
        applicationTrackStep: true,
      },
    });




    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

     // 🔥 Resolve applicationId correctly
     const applicationId =
     existing.periodStep?.servicePeriod?.applicationId ||
     existing.applicationTrackStep?.applicationId;

   if (!applicationId) {
     return res.status(400).json({
       success: false,
       message: "Cannot determine application for this document",
     });
   }

  //  console.log(existing)

    // optional: lock verified docs
    if (existing.status === "VERIFIED") {
      return res.status(400).json({
        success: false,
        message: "Verified document cannot be modified"
      });
    }

    const application = await prisma.application.findUnique({
      where: { applicationId },
      select: {
        userId: true,
        employeeId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const employeeId = application?.employeeId;
   

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

     // 🔥 Log
     await logHistory({
      applicationId: applicationId,
      action: "DOCUMENT_UPLOADED",
      newValue: documentId,
      doneByRole: "USER",
      doneById: application.userId || null,
      message: `User (${application?.user?.name}) uploaded document (v${doc.version})`,
    });
    
    if (employeeId) {
      createNotification({
        title: "Document Uploaded",
        description: `${application?.user?.name} uploaded ${existing.documentType} (v${doc.version})`,
        employeeId,
        redirectUrl: `/tasks/${applicationId}`,
      }).catch(console.error);
    }


    res.json({ success: true, document: doc });
  } catch (error) {
    console.error("User upload document error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router