const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");

// app.put("/service/:serviceId", async (req, res) => {
//     try {
//       const { serviceId } = req.params;
  
//       const {
//         name,
//         description,
//         serviceType,
//         frequency,
//         duration,
//         durationUnit,
//         individualPrice,
//         offerPrice,
//         isGstApplicable,
//         gstPercentage,
//         finalIndividualPrice,
//         subCategoryId,
//         employeeId
//       } = req.body;
  
//       const updatedService = await prisma.service.update({
//         where: { serviceId: serviceId }, // convert to number if ID is Int
//         data: {
//           name,
//           description,
//           serviceType,
//           frequency,
//           duration,
//           durationUnit,
//           individualPrice,
//           offerPrice,
//           isGstApplicable,
//           gstPercentage,
//           finalIndividualPrice,
//           subCategoryId,
//           employeeId
//         }
//       });
  
//       res.json({ success: true, service: updatedService });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         error: error.message
//       });
//     }
//   });

router.put("/service/:serviceId/track-steps", async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { steps } = req.body; // array of steps with id
  
      const result = await prisma.$transaction(
        steps.map((step) =>
          prisma.serviceTrackStep.update({
            where: {
              stepId: step.id,
              serviceId: serviceId // extra safety
            },
            data: {
              title: step.title,
              order: step.order,
              description: step.description
            }
          })
        )
      );
  
      res.json({
        success: true,
        message: "Track steps updated successfully",
        steps: result
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
  


// router.patch("/service/:serviceId/input-fields/:fieldId",async (req, res) => {
//       try {
//         const { serviceId, fieldId } = req.params;
//         const data = req.body;
  
//         // 1️⃣ Check service exists
//         const service = await prisma.service.findUnique({
//           where: { serviceId },
//         });
  
//         if (!service) {
//           return res.status(404).json({
//             success: false,
//             message: "Service not found",
//           });
//         }
  
//         // 2️⃣ Check field exists
//         const field = await prisma.serviceInputField.findUnique({
//           where: { fieldId: fieldId },
//         });
  
//         if (!field) {
//           return res.status(404).json({
//             success: false,
//             message: "Service input field not found",
//           });
//         }
  
//         // 3️⃣ Check field belongs to service
//         if (field.serviceId !== serviceId) {
//           return res.status(403).json({
//             success: false,
//             message: "Field does not belong to this service",
//           });
//         }
  
//         // 4️⃣ Update service-level field
//         const updated = await prisma.serviceInputField.update({
//           where: { fieldId : fieldId },
//           data: data,
//         });
  
//         return res.status(200).json({
//           success: true,
//           data: updated,
//         });
//       } catch (error) {
//         return res.status(500).json({
//           success: false,
//           message: error.message,
//         });
//       }
//     }
//   );
  
  

  router.patch("/service/:serviceId", async (req, res) => {
    try {
      const { serviceId } = req.params;
      const data = req.body  

      const service = await prisma.service.update({
        where: { serviceId: serviceId },
        data: data
      });
  
      res.json({ success: true, service });
    } catch (error) {
    //   if (error.code === "P2025") {
    //     return res.status(404).json({ success: false, message: "Service not found" });
    //   }
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

  module.exports = router
  