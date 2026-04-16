const express = require("express");
const router = express.Router();
const prisma = require("../../prisma/prisma");


router.get("/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;

    // ✅ Query params
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // ✅ WHERE condition (dynamic)
    const whereCondition = {
      employeeId: employeeId,

      ...(status && { status }),

      ...(search && {
        OR: [
          {
            serviceName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            user: {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    };

    // ✅ Get total count (for pagination)
    const totalCount = await prisma.application.count({
      where: whereCondition,
    });

    // ✅ Fetch paginated data
    const applications = await prisma.application.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: Number(limit),

      select: {
        applicationId: true,
        status: true,
        createdAt: true,

        serviceName: true,
        serviceType: true,
        servicePhoto: true,

        // service: {
        //   select: {
        //     name: true,
        //     serviceType: true,
        //     photoUrl: true,
        //   },
        // },

        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    // ✅ Format response
    const formatted = applications.map((app) => ({
      applicationId: app.applicationId,
      serviceName: app.serviceName,
      serviceType: app.serviceType,
      servicePhotoUrl: app.servicePhoto,
      status: app.status,
      createdAt: app.createdAt,
      userId: app.user?.userId,
      name: app.user?.name,
      email: app.user?.email,
      phoneNumber: app.user?.phoneNumber,
    }));

    res.json({
      success: true,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCount / limit),
      },
      applications: formatted,
    });
  } catch (error) {
    console.error("Get staff applications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


router.get("/:employeeId/detail/:applicationId", async (req, res) => {
    try {
      const { employeeId, applicationId } = req.params;
  
      const application = await prisma.application.findFirst({
        where: {
          applicationId,
          employeeId, // ✅ IMPORTANT CHECK
        },
        include: {
          // service: true,
          

  // 🔥 IMPORTANT: STEP TRACKING
  applicationTrackStep: {
    orderBy: {
    order: "asc",
    },
    },
          
  
          servicePeriod: {
            orderBy: {
              createdAt: "asc",
            },  
            include: { // 🟢 ADDED (so staff sees monthly steps)
                periodStep: {
                  orderBy: { order: "asc" },
                  include: {
                    // 🔥 PERIOD STEP KULLA SERVICE DOCUMENT
                    serviceDocument: true,
                  },
                }, 
             
              },
              
          },
        },
      });
  
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found or access denied",
        });
      }
  
      res.json({
        success: true,
        application,
      });
    } catch (error) {
      console.error("Get application detail error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });


module.exports = router


