const express = require("express");
const router = express.Router();
const prisma = require("../src/prisma/prisma");
const {deleteS3Object} = require("../src/utils/deleteS3Object")
const {serviceImgUpload,bundleServiceImgUpload} = require("../src/utils/multer");


router.put("/service/:serviceId",serviceImgUpload.single("photoUrl"),
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

router.put("/service/:serviceId/input-fields", async (req, res) => {
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

router.put("/service/:serviceId/track-steps", async (req, res) => {
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

router.delete("/service/:serviceId", async (req, res) => {
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

router.put("/bundle/:bundleId",bundleServiceImgUpload.single("photoUrl"),
  async (req, res) => {
    try {
      const { bundleId } = req.params;

      const {
        name,
        description,
        bundlePrice,
        bundleOfferPrice,
        isGstApplicable,
        gstPercentage,
        serviceIds,
        finalBundlePrice,
      } = req.body;

      // 🔹 Find existing bundle
      const existingBundle = await prisma.serviceBundle.findUnique({
        where: { bundleId },
        include: { services: true },
      });

      if (!existingBundle) {
        return res
          .status(404)
          .json({ success: false, message: "Bundle not found" });
      }

      // 🔹 Handle Image (optional update)
      let photoUrl = existingBundle.photoUrl;
      if (req.file) {
        photoUrl = req.file.location;

        // OPTIONAL: delete old image from S3
        await deleteS3Object(existingBundle.photoUrl);
      }

      
      // 🔹 Update Bundle
      const updatedBundle = await prisma.serviceBundle.update({
        where: { bundleId },
        data: {
          name,
          description,
          bundlePrice: Number(bundlePrice),
          bundleOfferPrice: Number(bundleOfferPrice),
          photoUrl,
          isGstApplicable: isGstApplicable === "true",
          gstPercentage: Number(gstPercentage),
          finalBundlePrice: Number(finalBundlePrice),

          // 🔹 Reset and reconnect services
          services: {
            connect: serviceIds.map((id) => ({ serviceId: id })),
          },
        },
        include: { services: true },
      });

      res.json({ success: true, bundle: updatedBundle });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

router.delete("/bundle/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { confirmName } = req.body;

    // 🔹 Find bundle
    const existingBundle = await prisma.serviceBundle.findUnique({
      where: { bundleId },
    });

    if (!existingBundle) {
      return res.status(404).json({
        success: false,
        message: "Bundle not found",
      });
    }

    // 🔹 Check name confirmation
    if (existingBundle.name !== confirmName) {
      return res.status(400).json({
        success: false,
        message: "Bundle name does not match. Delete cancelled.",
      });
    }

    // 🔹 Delete bundle
    await prisma.serviceBundle.delete({
      where: { bundleId },
    });

    // 🔹 OPTIONAL: delete image from S3
    if (existingBundle.photoUrl) {
      await deleteS3Object(existingBundle.photoUrl);
    }

    res.json({
      success: true,
      message: "Bundle deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// router.patch("/service/:serviceId",serviceImgUpload.single("photoUrl"),async (req, res) => {
//     try {
//       const { serviceId } = req.params;

//       // 🔹 Check existing service
//       const existingService = await prisma.service.findUnique({
//         where: { serviceId },
//       });

//       if (!existingService) {
//         return res.status(404).json({ message: "Service not found" });
//       }

//       // 🔹 Copy only provided fields
//       const data = { ...req.body };

//       // 🔹 Parse points (if exists)
//       if (data.points) {
//         try {
//           data.points = JSON.parse(data.points);
//         } catch {
//           return res.status(400).json({ message: "Invalid points JSON" });
//         }
//       }

//       // 🔹 Handle image
//       if (req.file) {
//         if (existingService.photoUrl) {
//           await deleteS3Object(existingService.photoUrl)
//         }
//         data.photoUrl = req.file.location;
//       }

//       // 🔹 Update service
//       const updatedService = await prisma.service.update({
//         where: { serviceId },
//         data,
//       });

//       res.json({ success: true, data: updatedService });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );

// router.patch("/service/:serviceId", async (req, res) => {
//   try {
//     const { serviceId } = req.params;
//     let data = { ...req.body };

//     // ✅ If file uploaded (using multer or similar)
//     if (req.file) {
//       // upload to S3 / Cloudinary
//       const imageUrl = await uploadImage(req.file); // your function
//       data.photoUrl = imageUrl;
//     }

//     // ❌ If no image, DO NOT overwrite photoUrl
//     const updatedService = await prisma.service.update({
//       where: { serviceId },
//       data,
//     });

//     res.json(updatedService);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Update failed" });
//   }
// });



// router.put("/service/:serviceId", async (req, res) => {
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

// router.put("/service/:serviceId/track-steps", async (req, res) => {
//     try {
//       const { serviceId } = req.params;
//       const { steps } = req.body; // array of steps with id
  
//       const result = await prisma.$transaction(
//         steps.map((step) =>
//           prisma.serviceTrackStep.update({
//             where: {
//               stepId: step.id,
//               serviceId: serviceId // extra safety
//             },
//             data: {
//               title: step.title,
//               order: step.order,
//               description: step.description
//             }
//           })
//         )
//       );
  
//       res.json({
//         success: true,
//         message: "Track steps updated successfully",
//         steps: result
//       });
//     } catch (error) {
//       res.status(500).json({ success: false, error: error.message });
//     }
//   });
  

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
  

  // router.patch("/service/:serviceId", async (req, res) => {
  //   try {
  //     const { serviceId } = req.params;
  //     const data = req.body  

  //     const service = await prisma.service.update({
  //       where: { serviceId: serviceId },
  //       data: data
  //     });
  
  //     res.json({ success: true, service });
  //   } catch (error) {
  //   //   if (error.code === "P2025") {
  //   //     return res.status(404).json({ success: false, message: "Service not found" });
  //   //   }
  //     res.status(500).json({ success: false, error: error.message });
  //   }
  // });
  

  module.exports = router
  