const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");


router.get("/", async (req, res) => {
  try {
    // 👉 Query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // 👉 Sorting (default: latest first)
    const sortOrder = req.query.sort === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    // 👉 Total count (for frontend pagination)
    const total = await prisma.serviceRequest.count({
      where: { status: "PENDING" },
    });

    // 👉 Data fetch
    const data = await prisma.serviceRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: sortOrder },
      skip,
      take: limit,

      include: {
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            phoneNumber: true,
            utmCampaignId: true,
            utmCampaignName: true,
          },
        },
        service: {
          select: {
            serviceId: true,
            name: true,
          },
        },
        bundle: {
          select: {
            bundleId: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


router.post("/action", async (req, res) => {
  try {
    const { requestId, adminId, action } = req.body;

    // 🔐 Validate input
    if (!requestId || !adminId || !action) {
      return res.status(400).json({
        success: false,
        message: "requestId, adminId and action are required",
      });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use APPROVE or REJECT",
      });
    }

    // 🔍 Get request
    const request = await prisma.serviceRequest.findUnique({
      where: { requestId },
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    // 🚫 Prevent duplicate processing
    if (request.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Already ${request.status}`,
      });
    }

    // =========================
    // ✅ APPROVE FLOW
    // =========================
    if (action === "APPROVE") {
      if (request.serviceId) {
        await prisma.myService.create({
          data: {
            userId: request.userId,
            serviceId: request.serviceId,
            status: "NOT_STARTED",
          },
        });
      }

      if (request.bundleId) {
        const bundle = await prisma.serviceBundle.findUnique({
          where: { bundleId: request.bundleId },
          include: { services: true },
        });

        if (!bundle) {
          return res.status(404).json({
            success: false,
            message: "Bundle not found",
          });
        }

        const data = bundle.services.map((s) => ({
          userId: request.userId,
          serviceId: s.serviceId,
          bundleId: request.bundleId,
          status: "NOT_STARTED",
        }));

        await prisma.myService.createMany({ data });
      }

      await prisma.serviceRequest.update({
        where: { requestId },
        data: {
          status: "APPROVED",
          employeeId:adminId,
        },
      });

      return res.json({
        success: true,
        message: "Request approved",
      });
    }

    // =========================
    // ❌ REJECT FLOW
    // =========================
    if (action === "REJECT") {
      await prisma.serviceRequest.update({
        where: { requestId },
        data: {
          status: "REJECTED",
          employeeId:adminId,
        },
      });

      return res.json({
        success: true,
        message: "Request rejected",
      });
    }
  } catch (error) {
    console.error("Service request action error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router