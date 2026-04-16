 const express = require("express");
 const router = express.Router();
 const prisma = require("../../prisma/prisma");
 const {logHistory} = require("../../utils/historyService")
 const {createNotification} = require("../../notifications/notificationService")

 
 router.get("/", async (req, res) => {
    try {
      const applications = await prisma.application.findMany({
        orderBy: {
          createdAt: "desc",
        },                 
        select: {
          applicationId: true,
          status: true,
          createdAt: true,
          serviceName: true,
          servicePhoto: true,
          serviceType: true,

          user: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
                          
          employee: {
            select: {
              name: true,
              photoUrl:true
            },
          },
  
          // servicePeriod: {
          //   select: {
          //       periodStep: true, // only count purpose
          //   },
          // },
        },
      });
     
  
      const formatted = applications.map((app) => ({
        applicationId: app.applicationId,
        userName: app.user?.name || null,
        phoneNumber: app.user?.phoneNumber || null,
        serviceName: app.serviceName,
        servicePhoto: app.servicePhoto || null,
        serviceType: app.serviceType,
        status: app.status,
        createdAt: app.createdAt,
        employeePhoto :app.employee?.photoUrl || null,
        employeeName: app.employee?.name || null,
   
      }));
  
      res.json({
        success: true,
        applications: formatted,
      
      });
    } catch (error) {
      console.error("Get app list error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  });
  
  router.get("/:applicationId", async (req, res) => {
    try {
      const { applicationId } = req.params;
  
      const application = await prisma.application.findUnique({
        where: { applicationId },
        include: {
          // service: {
        
          // },
          employee: {
            select: {
              employeeId: true,
              name: true,
            },
          },

             // 🟢 ONE-TIME SERVICE STEPS (important if not recurring)
        applicationTrackStep: {                 // 🟢 ADDED
            orderBy: { order: "asc" },            // 🟢 ADDED
          },
          servicePeriod: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
                periodStep: {              // 🟢 ADDED — this brings monthly steps
                  orderBy: { order: "asc" } // 🟢 ADDED — steps in correct order
                }
              }
          },
        },
      });
  
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
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
  
  router.get("/reminders", async (req, res) => {
    const data = await prisma.reminder.findMany({
      orderBy: { dueDate: "asc" },
    });
  
    const grouped = {};
  
    data.forEach((item) => {
      const due = new Date(item.dueDate).toDateString(); // key
  
      if (!grouped[due]) {
        grouped[due] = {
          dueDate: due,
          reminders: [],
        };
      }
  
      grouped[due].reminders.push(
        new Date(item.reminderDate).toDateString()
      );
    });
  
    res.json(Object.values(grouped));
  });



  router.post("/:applicationId/assign",async (req, res) => {
      try {
        const { applicationId } = req.params;
        const { employeeId, adminNote } = req.body;
  
        // 1️⃣ Basic validation
        if (!employeeId) {
          return res.status(400).json({
            success: false,
            message: "employeeId is required",
          });
        }

        /* 2️⃣ Fetch existing application */
      const existingApplication = await prisma.application.findUnique({
        where: { applicationId },
        include: {
          employee: true, // 🔥 get old employee details
        },
      });

      if (!existingApplication) {
        return res.status(404).json({
          success: false,
          message: "Application not found",
        });
      }

      const oldEmployeeId = existingApplication.employeeId;
      const oldEmployeeName = existingApplication.employee?.name || null;


      const newEmployee = await prisma.employee.findUnique({
        where: { employeeId },
      });
  
      if (!newEmployee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
  
        // 2️⃣ Update application
        const application = await prisma.application.update({
          where: { applicationId },
          data: {
            employeeId,
            adminNote,
            status: "ASSIGNED",
          },
        });

        /* 4️⃣ Log history (Assign or Reassign only) */
//         await logHistory({
//           applicationId,
//           action: oldEmployeeId
//             ? "APPLICATION_REASSIGNED"
//             : "APPLICATION_ASSIGNED",
//           oldValue: oldEmployeeId
//             ? `${oldEmployeeId} (${oldEmployeeName})`
//             : null,
//           newValue: `${newEmployee.employeeId} (${newEmployee.name})`,
//           doneByRole: "ADMIN",
//           doneById: req.user?.id || null,
//           message: oldEmployeeId
//             ? `Reassigned from ${oldEmployeeName} to ${newEmployee.name}`
//             : `Assigned to ${newEmployee.name}`,
//         });

//         // 🔔 Send Notification to Employee
// await createNotification({
//   title: "New Service Assigned",
//   description: "You have been assigned a new service request",
//   employeeId: newEmployee.employeeId,
//   redirectUrl: "/tasks",
// });

// await createNotification({
//   title: "Service Update",
//   description: isReassigned
//     ? `Your request has been reassigned to ${newEmployee.name}`
//     : `Your request has been assigned to ${newEmployee.name}`,
//   userId: existingApplication.userId,
//   redirectUrl: "/my-requests",
// })

const isReassigned = !!oldEmployeeId;

// ✅ Log History (simple)
await logHistory({
  applicationId,
  action: isReassigned
    ? "APPLICATION_REASSIGNED"
    : "APPLICATION_ASSIGNED",
  oldValue: oldEmployeeId
    ? `${oldEmployeeId} (${oldEmployeeName})`
    : null,
  newValue: `${newEmployee.employeeId} (${newEmployee.name})`,
  doneByRole: "ADMIN",
  doneById: req.user?.id || null,
  message: isReassigned
    ? `Reassigned from ${oldEmployeeName} to ${newEmployee.name}`
    : `Assigned to ${newEmployee.name}`,
});

// 🔔 Notify Employee
createNotification({
  title: "New Service Assigned",
  description: isReassigned
    ? "A service request has been reassigned to you"
    : "You have been assigned a new service request",
  employeeId: newEmployee.employeeId,
  redirectUrl: "/tasks",
}).catch(console.error);

// 🔔 Notify User
if (existingApplication.userId) {
  createNotification({
    title: "Service Update",
    description: isReassigned
      ? `Your request has been reassigned to ${newEmployee.name}`
      : `Your request has been assigned to ${newEmployee.name}`,
    userId: existingApplication.userId,
  }).catch(console.error);
}
    
  
        res.json({
          success: true,
          message: "Application assigned to staff successfully",
          application,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Failed to assign application",
        });
      }
    }
  );


  router.get("/employees/assignable", async (req, res) => {
    try {
      const { search = "" } = req.query;
  
      const whereCondition = {
        status: "ACTIVE",
        role: "STAFF",
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              employeeId: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              department: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          ],
        }),
      };
  
      const employees = await prisma.employee.findMany({
        where: whereCondition,
        select: {
          employeeId: true,
          name: true,
          email: true,
          photoUrl: true,
          department: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
  
      res.json({
        success: true,
        data: employees,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });


  module.exports = router