const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");
const {sendEmail} = require("../../email/emailService")


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
      include: { user: true },
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

      const hrefWebsiteLink = "https://insightconsulting.info"
      const WebsiteLink = "www.insightconsulting.info"
      const companyName = "Insight Consulting"
      await sendEmail({
        eventName: "REQUEST_APPROVED",
        to: request.user.email,
        subject: "Your request has been approved",
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;">
          <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;">
      
            <div style="border-left: 3px solid #f13c20; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">Your request has been approved</h2>
              <p style="margin: 0; font-size: 13px; color: #888;">Service update</p>
            </div>
      
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 12px;">Hi <strong>${request.user.name}</strong>,</p>
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
              Great news! Your service request has been approved. You can now access your service from your dashboard.
            </p>
      
            <a href="${hrefWebsiteLink}/my-services"
               style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
              Go to my services
            </a>
      
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" />
            <p style="margin: 0 0 6px; color: #aaa; font-size: 12px; text-align: center;">
              Service update from <strong style="color: #888;">${companyName}</strong>.
            </p>
            <p style="margin: 0; font-size: 12px; text-align: center;">
              <a href="${hrefWebsiteLink}" style="color: #f13c20; text-decoration: none;">${WebsiteLink}</a>
            </p>
          </div>
        </div>
        `,
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

      const hrefWebsiteLink = "https://insightconsulting.info"
      const WebsiteLink = "www.insightconsulting.info"
      const companyName = "Insight Consulting"
      await sendEmail({
        eventName: "REQUEST_REJECTED",
        to: request.user.email,
        subject: "Your request was not approved",
        html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;">
          <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;">
      
            <div style="border-left: 3px solid #a32d2d; padding-left: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">Your request was not approved</h2>
              <p style="margin: 0; font-size: 13px; color: #888;">Service update</p>
            </div>
      
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 12px;">Hi <strong>${request.user.name}</strong>,</p>
            <p style="color: #444; font-size: 14px; line-height: 1.8; margin: 0 0 24px;">
              Unfortunately, your service request has been reviewed and was not approved at this time.
              If you have any questions or need further assistance, please feel free to contact us.
            </p>
      
            <a href="${hrefWebsiteLink}/contact"
               style="display: inline-block; background: #a32d2d; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
              Contact us
            </a>
      
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" />
            <p style="margin: 0 0 6px; color: #aaa; font-size: 12px; text-align: center;">
              Service update from <strong style="color: #888;">${companyName}</strong>.
            </p>
            <p style="margin: 0; font-size: 12px; text-align: center;">
              <a href="${hrefWebsiteLink}" style="color: #f13c20; text-decoration: none;">${WebsiteLink}</a>
            </p>
          </div>
        </div>
        `,
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