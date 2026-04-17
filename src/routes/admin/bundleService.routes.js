   const express = require("express");
   const router = express.Router();
   const prisma = require("../../prisma/prisma");
   const {deleteS3Object} = require("../../utils/deleteS3Object")
   const {bundleServiceImgUpload} = require("../../utils/multer")
 
 // =============================
  // CREATE BUNDLE WITH SERVICES
  // =============================
  router.post("/", bundleServiceImgUpload.single("photoUrl"),async (req, res) => {
    try {
      const { name, description, bundlePrice,  bundleOfferPrice,isGstApplicable,
        gstPercentage, serviceIds ,finalBundlePrice } = req.body;
       
        const photoUrl = req.file.location 
        

      const bundle = await prisma.serviceBundle.create({
        data: {
          name,
          description,
          bundlePrice:Number(bundlePrice),
          bundleOfferPrice:Number(bundleOfferPrice),
          photoUrl,
          isGstApplicable:isGstApplicable === "true",
          gstPercentage:Number(gstPercentage),
          finalBundlePrice:Number(finalBundlePrice),
          services: {
            connect: serviceIds.map((id) => ({ serviceId: id })),
          },
        },
        include: { services: true },
      });
  
      res.json({ success: true, bundle });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

    router.get("/", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
    
        const skip = (page - 1) * limit;
    
        const whereCondition = search
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {};
    
        const [bundles, total] = await Promise.all([
          prisma.serviceBundle.findMany({
            where: whereCondition,
            skip: skip,
            take: limit,
            orderBy: {
              createdAt: "desc",
            },
            include: {
              services: {
                select: {
                  serviceId: true,
                  name: true,
                },
              },
            },
          }),
    
          prisma.serviceBundle.count({
            where: whereCondition,
          }),
        ]);
    
        res.json({
          success: true,
          pagination: {
            totalRecords: total,
            currentPage: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
          },
          bundles,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

  router.put("/:bundleId",bundleServiceImgUpload.single("photoUrl"),
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
  
  router.delete("/:bundleId", async (req, res) => {
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


  module.exports = router;