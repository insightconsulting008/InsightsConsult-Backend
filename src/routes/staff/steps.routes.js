const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const {logHistory} = require("../../../src/utils/historyService")
const {createNotification} = require("../../notifications/notificationService")

router.put("/update/step", async (req, res) => {
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
      let applicationId;
      let oldStatus;
      
  
      // ===============================
      // 🟢 ONE-TIME STEP UPDATE
      // ===============================
      if (applicationTrackStepId) {

        const existing = await prisma.applicationTrackStep.findUnique({
          where: { applicationTrackStepId },
          select: {
            applicationId: true,
            status: true,
            title: true, // ✅ ADD THIS
          },
        });

        if (!existing) {
          return res.status(404).json({
            success: false,
            message: "Step not found",
          });
        }
  
        applicationId = existing.applicationId;
        oldStatus = existing.status;

        updatedStep = await prisma.applicationTrackStep.update({
          where: { applicationTrackStepId },
          data: {
            status: status,
            description,
            remarks,
            updatedAt: new Date(),
          },
        });

        await logHistory({
          applicationId,
          action: "STEP_UPDATED",
          oldValue: oldStatus,
          newValue: status,
          doneByRole: "STAFF",
          doneById: req.user?.id || null,
          message: `Step changed from ${oldStatus} to ${status}`,
        });

       
        if (oldStatus !== status) {
          const application = await prisma.application.findUnique({
            where: { applicationId },
            select: { userId: true ,myServiceId:true,serviceName:true},
          });
  
          if (application?.userId) {
            createNotification({
              title: `${application.serviceName} - Application Step Updated`,
              description:
                status === "COMPLETED"
                  ? `Application "${existing.title}" Step Completed`
                  : `Application "${existing.title}" Step Updated to ${status}`,
              userId: application.userId,
              redirectUrl: `/my-service/view/${application.myServiceId}`,
            }).catch(console.error);
          }
        }

      }
      
  
      // ===============================
      // 🔵 PERIOD STEP UPDATE
      // ===============================
      if (periodStepId) {

        const existing = await prisma.periodStep.findUnique({
          where: { periodStepId },
          select: {
            status: true,
            servicePeriodId: true,
            title: true, // ✅ ADD THIS
            servicePeriod: {
              select: { applicationId: true }
            }
          },
        });

        if (!existing) {
          return res.status(404).json({
            success: false,
            message: "Period step not found",
          });
        }

        applicationId = existing.servicePeriod.applicationId;
        oldStatus = existing.status;
  
        
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

        await logHistory({
          applicationId,
          action: "PERIOD_STEP_UPDATED",
          oldValue: oldStatus,
          newValue: status,
          doneByRole: "STAFF",
          doneById: req.user?.id || null,
          message: `Period step changed from ${oldStatus} to ${status}`,
        });

              // 🔔 Notification
      if (oldStatus !== status) {
        const application = await prisma.application.findUnique({
          where: { applicationId },
          select: { userId: true ,myServiceId:true,serviceName:true},
        });

        if (application?.userId) {
          createNotification({
            title: `${application.serviceName} - Application Step Updated`,
            description:
              status === "COMPLETED"
                ? `Application  ("${existing.title}") Step  Completed`
                : `Application  ("${existing.title}") Step Updated to ${status}`,
            userId: application.userId,
            redirectUrl: `/my-service/view/${application.myServiceId}`,
          }).catch(console.error);
        }
      }
       
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


  module.exports = router