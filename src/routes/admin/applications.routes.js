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


const isReassigned = !!oldEmployeeId;


const hrefWebsiteLink = "https://insightconsulting.info"
const WebsiteLink = "www.insightconsulting.info"
const companyName = "Insight Consulting"

await sendEmail({
    eventName: "TASK_ASSIGNED",
    to: newEmployee.email,
    subject: isReassigned
      ? "Service request reassigned to you"
      : "New service request assigned to you",
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;">
  
        <div style="border-left: 3px solid #f13c20; padding-left: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">
            ${isReassigned ? "Service request reassigned to you" : "New service request assigned"}
          </h2>
          <p style="margin: 0; font-size: 13px; color: #888;">Task notification</p>
        </div>
  
        <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
          Hi <strong>${newEmployee.name}</strong>, a service request has been
          ${isReassigned ? "reassigned to you" : "assigned to you"}.
          Please review the details and take action.
        </p>
  
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #eee; font-size: 13px; line-height: 2;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #999;">Application ID</span>
            <span style="color: #222; font-weight: 500;">${applicationId}</span>
          </div>
          ${isReassigned ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #999;">Previously assigned to</span>
            <span style="color: #222; font-weight: 500;">${oldEmployeeName}</span>
          </div>` : ""}
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #999;">Assigned by</span>
            <span style="color: #222; font-weight: 500;">Admin</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #999;">Date</span>
            <span style="color: #222; font-weight: 500;">${new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
          </div>
        </div>
  
        <a href="${hrefWebsiteLink}/tasks"
           style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
          View task
        </a>
  
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;" />
        <p style="margin: 0 0 6px; color: #aaa; font-size: 12px; text-align: center;">
          Task notification from <strong style="color: #888;">${companyName}</strong>.
        </p>
        <p style="margin: 0; font-size: 12px; text-align: center;">
          <a href="${hrefWebsiteLink}" style="color: #f13c20; text-decoration: none;">${WebsiteLink}</a>
        </p>
      </div>
    </div>
    `
  });

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

    const user = existingApplication.user; // make sure to include user in your findUnique
    const hrefWebsiteLink = "https://insightconsulting.info"
    const WebsiteLink = "www.insightconsulting.info"
    const companyName = "Insight Consulting"
  await sendEmail({
    eventName: "SERVICE_UPDATE",
    to: user.email,
    subject: isReassigned
      ? "Your request has been reassigned"
      : "Your request has been assigned",
    html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f9fafb; padding: 20px 10px;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eee; padding: 30px;">

        <div style="border-left: 3px solid #f13c20; padding-left: 16px; margin-bottom: 24px;">
          <h2 style="margin: 0 0 4px; color: #111; font-size: 17px; font-weight: 600;">
            ${isReassigned ? "Your request has been reassigned" : "Your request has been assigned"}
          </h2>
          <p style="margin: 0; font-size: 13px; color: #888;">Service update</p>
        </div>

        <p style="color: #444; font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
          Hi <strong>${user.name}</strong>, here's a quick update on your service request.
        </p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid #eee; font-size: 13px; line-height: 2;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #999;">Application ID</span>
            <span style="color: #222; font-weight: 500;">${applicationId}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #999;">Assigned staff</span>
            <span style="color: #222; font-weight: 500;">${newEmployee.name}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #999;">Status</span>
            <span style="background: #eaf3de; color: #3b6d11; font-size: 12px; padding: 2px 10px; border-radius: 20px; font-weight: 500;">Assigned</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #999;">Date</span>
            <span style="color: #222; font-weight: 500;">${new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
          </div>
        </div>

        <div style="background: #f0f9ff; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px; border: 1px solid #bde0f7; font-size: 13px; color: #185fa5; line-height: 1.6;">
          Our team is now working on your request. You'll be notified once there's an update.
        </div>

        <a href="${hrefWebsiteLink}/my-requests"
           style="display: inline-block; background: #f13c20; color: #fff; padding: 11px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none;">
          View my request
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
    `
  });


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