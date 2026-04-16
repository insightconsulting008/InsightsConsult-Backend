 const express = require("express");
 const router = express.Router();
 const prisma = require("../../prisma/prisma");


router.get("/", async (req, res) => {
  try {
    // ✅ query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";

    const skip = (page - 1) * limit;

    // ✅ search filter
    const where = search
      ? {
          OR: [
            {
              user: {
                name: { contains: search, mode: "insensitive" },
              },
            },
            {
              user: {
                email: { contains: search, mode: "insensitive" },
              },
            },
            {
              service: {
                name: { contains: search, mode: "insensitive" },
              },
            },
            {
              employee: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }
      : {};

    // ✅ get data
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        select: {
          applicationId: true,
          createdAt: true,

          user: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },

          service: {
            select: {
              name: true,
              serviceType: true,
            },
          },

          employee: {
            select: {
              employeeId: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.application.count({ where }),
    ]);

    return res.json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      applications,
    });
  } catch (error) {
    console.error("Application history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
});

router.get("/:applicationId", async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.application.findUnique({
      where: { applicationId },

      select: {
        applicationId: true,
        createdAt: true,

        // ✅ USER DETAILS
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },

        // ✅ SERVICE DETAILS
        service: {
          select: {
            serviceId: true,
            name: true,
            serviceType: true, // (remove if not in your schema)
          },
        },

        // ✅ EMPLOYEE DETAILS
        employee: {
          select: {
            employeeId: true,
            name: true,
            email: true,
          },
        },

        // ✅ HISTORY
        applicationHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Application history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch application history",
    });
  }
});

module.exports = router