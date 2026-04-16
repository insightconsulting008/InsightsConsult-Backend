const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const config = require("../../utils/config")
const {myDocuments} = require('../../utils/multer')
const {logHistory} = require("../../../src/utils/historyService")
const {createNotification} = require("../../notifications/notificationService")


router.post("/",myDocuments.single("file"),async (req, res) => {
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


      let assignedEmployeeId = null;
      let assignedEmployeeName = null;
      let userId = null;
      let myServiceId = null;


            // ---------- TRACK STEP PATH ----------
            if (applicationTrackStepId) {
              const track = await prisma.applicationTrackStep.findUnique({
                where: { applicationTrackStepId },
                select: {
                  application: {
                    select: {
                      applicationId: true,
                      myServiceId: true, // 👈 ADD THIS
                      userId: true, // 👈 ADD THIS
                      employeeId: true,
                      employee: {
                        select: { name: true },
                      },
                    },
                  },
                },
              });
      
              if (!track?.application) {
                return res.status(404).json({
                  success: false,
                  message: "Application track step not found",
                });
              }
              applicationId = track.application.applicationId;
              assignedEmployeeId = track.application.employeeId;
              assignedEmployeeName = track.application.employee?.name;
              userId = track.application.userId;
              myServiceId = track.application.myServiceId;
            }

              // ---------- PERIOD STEP PATH ----------
      if (periodStepId) {
        const period = await prisma.periodStep.findUnique({
          where: { periodStepId },
          select: {
            servicePeriod: {
              select: {
                application: {
                  select: {
                    applicationId: true,
                    myServiceId: true, // 👈 ADD THIS
                    userId: true, // 👈 ADD THIS
                    employeeId: true,
                    employee: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!period?.servicePeriod?.application) {
          return res.status(404).json({
            success: false,
            message: "Period step not found",
          });
        }

        const app = period.servicePeriod.application;
        applicationId = app.applicationId;
        assignedEmployeeId = app.employeeId;
        assignedEmployeeName = app.employee?.name;
        userId = app.userId;
        myServiceId = app.myServiceId;
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
        

        await logHistory({
          applicationId,
          action: "DOCUMENT_REQUESTED",
          newValue: documentType,
          doneByRole: "STAFF",
          doneById: assignedEmployeeId ,
          message: `Document requested: ${documentType} by ${assignedEmployeeName}`,
        });

        if (userId) {
          createNotification({
            title: "Document Requested",
            description: `Please upload: ${documentType}`,
            userId,
            redirectUrl: `/my-service/view/${myServiceId}`, // 👈 dynamic
          }).catch(console.error);
        }

      
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


        await logHistory({
          applicationId,
          action: "DOCUMENT_ISSUED",
          newValue: documentType,
          doneByRole: "STAFF",
          doneById: assignedEmployeeId,
          message: `Document issued: ${documentType} by ${ assignedEmployeeName }`
        });

        if (userId) {
          createNotification({
            title: "Document Issued",
            description: `${documentType} has been issued successfully`,
            userId,
            redirectUrl: `/my-service/view/${myServiceId}`, // 👈 same page
          }).catch(console.error);
        }
      
        return res.json({ success: true, document: doc });
      }

    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false });
    }
  }
);

router.put("/:documentId/review-document", async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, remark } = req.body; // VERIFIED or REJECTED

    if (!["VERIFIED", "REJECTED","FOR_REVIEW"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
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

    


    if (!existing.fileUrl && !existing.textValue) {
      return res.status(400).json({
        success: false,
        message: "User has not uploaded document yet"
      });
    }
    // 🔥 Resolve applicationId properly
    const applicationId =
      existing.periodStep?.servicePeriod?.applicationId ||
      existing.applicationTrackStep?.applicationId;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Cannot determine application for this document",
      });
    }

    const application = await prisma.application.findUnique({
      where: { applicationId },
      select: {
        employeeId: true,
        myServiceId: true,
        userId: true, // ✅ ADD
        employee: {
          select: {
            name: true,
          },
        },
      },
    });
    
    if (!application || !application.employeeId) {
      return res.status(400).json({
        success: false,
        message: "No employee assigned to this application",
      });
    }
    
    const employeeId = application.employeeId;
    const employeeName = application.employee.name;
    const myServiceId = application.myServiceId;

    const doc = await prisma.serviceDocument.update({
      where: { documentId },
      data: { status, remark, uploadedBy:"staff" },
    });


    await logHistory({
      applicationId:applicationId,
      action:
      status === "VERIFIED"
      ? "DOCUMENT_VERIFIED"
      : "DOCUMENT_REJECTED",
      oldValue: existing.status,
      newValue: status,
      doneByRole: "STAFF",
      doneById: employeeId || null,
      message: `Document ${status} by ${employeeName}`,
    });

    // 🔔 Notify User
if (application?.userId) {
  createNotification({
    title:
      status === "VERIFIED"
        ? "Document Verified"
        : "Document Rejected",

    description:
      status === "VERIFIED"
        ? `${existing.documentType} verified successfully`
        : `${existing.documentType} rejected. ${remark || "Please re-upload"}`,

    userId: application.userId,

    // ✅ CONDITIONAL REDIRECT
    redirectUrl:
      status === "REJECTED"
        ? `/my-service/view/${myServiceId}` // 👈 go fix document
        : null, // 👈 normal page or dashboard
  }).catch(console.error);
}

    res.json({ success: true, document: doc });
  } catch (error) {
    console.error("Review document error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
//this vanthu night amal sona api in /staff 
router.get("/application/:applicationId", async (req, res) => {
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
                isLocked: false, // 🔥 FILTER HERE
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

module.exports = router