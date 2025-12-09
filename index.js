const express = require("express");
const cors = require("cors");
const app = express();
const prisma = require('./src/prisma/prisma')

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors());
app.use(express.json());

/* -------------------- ROUTES -------------------- */
app.get("/test", (req, res) => {
  res.json({
    message: "Insight Consulting Project Server is running 🚀"
  });
});


/* -------------------- ROUTES -------------------- */


/* =====================================================
   DEPARTMENT APIs
===================================================== */

/** ✅ Create Department  **/
app.post("/department", async (req, res) => {
    try {
      const { name, departmentCode, labelColor } = req.body;
  
      const department = await prisma.department.create({
        data: {
          name,
          departmentCode,
          labelColor
        }
      });
  
      res.status(201).json({
        success: true,
        message: "Department created successfully",
        data: department
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
/** ✅ Get All Departments **/
app.get("/department", async (req, res) => {
    try {
      const departments = await prisma.department.findMany();
      res.json({ success: true, data: departments });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

/** ✅ Get Department by ID **/
app.get("/department/:departmentId", async (req, res) => {
    try {
      const { departmentId } = req.params;
  
      const department = await prisma.department.findUnique({
        where: { departmentId }
      });
  
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found"
        });
      }
  
      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

/** ✅ Update Department **/
app.put("/department/:departmentId", async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { name, departmentCode, labelColor } = req.body;
  
      const department = await prisma.department.update({
        where: { departmentId },
        data: { name, departmentCode, labelColor }
      });
  
      res.json({
        success: true,
        message: "Department updated successfully",
        data: department
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
/** ✅ Delete Department by ID **/
app.delete("/department/:departmentId", async (req, res) => {
    try {
      const { departmentId } = req.params;
  
      await prisma.department.delete({
        where: { departmentId }
      });
  
      res.json({
        success: true,
        message: "Department deleted successfully"
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
/* =====================================================
   EMPLOYEE APIs
===================================================== */

/** ✅ Create Employee  **/
  app.post("/employee", async (req, res) => {
    try {
      const {
        name,
        email,
        mobileNumber,
        role,
        designation,
        password,
        photoUrl,
        departmentId
      } = req.body;
  
      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { departmentId }
      });
  
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found"
        });
      }

          // ✅ 1. Check if email already exists
    const existingEmployee = await prisma.employee.findUnique({
        where: { email }
      });
  
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
  
      const employee = await prisma.employee.create({
        data: {
          name,
          email,
          mobileNumber,
          password,
          role,
          designation,
          status: "ACTIVE",
          photoUrl,
          departmentId
        }
      });
  
      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: employee
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /** ✅ Get All Employee  **/
  app.get("/employee", async (req, res) => {
    try {
      const employees = await prisma.employee.findMany();
  
      res.json({ success: true, data: employees });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

    /** ✅ Get Employee By EmployeeId  **/
  app.get("/employee/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
  
      const employee = await prisma.employee.findUnique({
        where: { employeeId }
      });
  
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found"
        });
      }
  
      res.json({ success: true, data: employee });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /** ✅ Update Employee By EmployeeId  **/
  app.put("/employee/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
      const {
        name,
        email,
        mobileNumber,
        role,
        designation,
        status,
        password,
        photoUrl,
        departmentId
      } = req.body;
  
      // Optional: check department exists if departmentId is provided
      if (departmentId) {
        const department = await prisma.department.findUnique({ where: { departmentId } });
        if (!department) {
          return res.status(404).json({ success: false, message: "Department not found" });
        }
      }
  
      const employee = await prisma.employee.update({
        where: { employeeId },
        data: { name, email, password, mobileNumber, role, designation, status, photoUrl, departmentId }
      });
  
      res.json({
        success: true,
        message: "Employee updated successfully",
        data: employee
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

 /** ✅ Delete Employee By EmployeeId  **/
  app.delete("/employee/:employeeId", async (req, res) => {
    try {
      const { employeeId } = req.params;
  
      await prisma.employee.delete({
        where: { employeeId }
      });
  
      res.json({
        success: true,
        message: "Employee deleted successfully"
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  



  // =============================
// CREATE SERVICE
// =============================
app.post("/service", async (req, res) => {
    try {
      const { name, description, individualPrice, employeeId } = req.body;
  
      const service = await prisma.service.create({
        data: { name, description, individualPrice, employeeId },
      });
  
      res.json({ success: true, service });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // =============================
  // GET ALL SERVICES WITH INPUTFIELDS + TRACKSTEPS
  // =============================
  app.get("/service", async (req, res) => {
    try {
      const services = await prisma.service.findMany({
        include: {
          inputFields: true,
          trackSteps: true,
        },
      });
  
      res.json({ success: true, services });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // =============================
  // ADD INPUT FIELD TO SERVICE
  // =============================
  app.post("/service/:serviceId/input-fields", async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { fields } = req.body; // array of fields
  
      const createdFields = await prisma.$transaction(
        fields.map((f) =>
          prisma.serviceInputField.create({
            data: {
              label: f.label,
              type: f.type,
              required: f.required,
              serviceId,
            },
          })
        )
      );
  
      res.json({ success: true, createdFields });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
  // =============================
  // ADD TRACK STEP TO SERVICE
  // =============================
// 
  app.post("/service/:serviceId/track-steps", async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { steps } = req.body; // array of steps
  
      const result = await prisma.$transaction(
        steps.map((step) =>
          prisma.serviceTrackStep.create({
            data: {
              title: step.title,
              order: step.order,
              serviceId
            }
          })
        )
      );
  
      res.json({
        success: true,
        message: "Track steps created successfully",
        steps: result
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
  // =============================
  // CREATE BUNDLE WITH SERVICES
  // =============================
  app.post("/bundle", async (req, res) => {
    try {
      const { name, description, bundlePrice, serviceIds } = req.body;
  
      const bundle = await prisma.serviceBundle.create({
        data: {
          name,
          description,
          bundlePrice,
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
  
  // =============================
  // GET ALL BUNDLES
  // =============================
  app.get("/bundle", async (req, res) => {
    try {
      const bundles = await prisma.serviceBundle.findMany({
        include: { services: true },
      });
  
      res.json({ success: true, bundles });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });


  app.get("/bundle/:bundleId/details", async (req, res) => {
    const { bundleId } = req.params;
  
    function uniqueById(arr) {
      const seen = new Set();
      return arr.filter(item => {
        if (seen.has(item.id)) {
          return false;
        }
        seen.add(item.id);
        return true;
      });
    }
  
    try {
      const bundle = await prisma.serviceBundle.findUnique({
        where: { bundleId },
        include: {
          services: {
            include: {
              inputFields: true,
              trackSteps: true,
            },
          },
        },
      });
  
      if (!bundle) {
        return res.status(404).json({ success: false, message: "Bundle not found" });
      }
  
      // Merge inputFields & trackSteps from all services
      const allInputs = bundle.services.flatMap(service => service.inputFields);
      const mergedSteps = bundle.services.flatMap(service => service.trackSteps);
  
      // Remove duplicates from inputFields by 'id'
      const uniqueInputs = uniqueById(allInputs);
  
      return res.json({
        success: true,
        bundle,
        allInputs,     // Full input fields including duplicates
        uniqueInputs,  // Input fields with duplicates removed
        mergedSteps,
      });
    } catch (error) {
      console.error("Error fetching bundle details:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
  
  
  
  // =============================
  // CREATE APPLICATION (FOR SERVICE OR BUNDLE)
  // =============================
  app.post("/application", async (req, res) => {
    try {
      const { serviceId, bundleId, employeeId, formData } = req.body;

      if (!serviceId && !bundleId) {
        return res.status(400).json({
          success: false,
          message: "serviceId or bundleId is required",
        });
      }
  
      // Create Application
      const application = await prisma.application.create({
        data: {
          serviceId,
          bundleId,
          employeeId,
          formData,
          status: "PENDING",
        },
      });
  
      // ================
      // If Service ID
      // ================
      if (serviceId) {
        const serviceSteps = await prisma.serviceTrackStep.findMany({
          where: { serviceId },
          orderBy: { order: "asc" },
        });
  
        await prisma.$transaction(
          serviceSteps.map((step) =>
            prisma.applicationTrackStep.create({
              data: {
                title: step.title,
                order: step.order,
                applicationId: application.applicationId,
              },
            })
          )
        );
      }
  
      // =================
      // If Bundle ID
      // =================
      if (bundleId) {
        const bundleSteps = await prisma.bundleTrackStep.findMany({
          where: { bundleId },
          orderBy: { order: "asc" },
        });
  
        await prisma.$transaction(
          bundleSteps.map((step) =>
            prisma.applicationTrackStep.create({
              data: {
                title: step.title,
                order: step.order,
                applicationId: application.applicationId,
              },
            })
          )
        );
      }
  
      res.json({
        success: true,
        message: "Application created successfully",
        application,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
  // ================================
  // GET ALL APPLICATIONS
  // ================================
  app.get("/applications", async (req, res) => {
    try {
      const apps = await prisma.application.findMany({
        orderBy: { createdAt: "desc" },
      });
  
      res.json({ success: true, applications: apps });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // ================================
  // GET SINGLE APPLICATION + LIVE TRACKING
  // ================================
  app.get("/application/:applicationId", async (req, res) => {
    try {
      const { applicationId } = req.params;
  
      const application = await prisma.application.findUnique({
        where: { applicationId },
        include: {
          trackSteps: {
            orderBy: { order: "asc" },
          },
          service: true,
          bundle: true, 
          employee: true,
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
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });




// ================================
// APPLICATION ASSIGN/REASSIGN
// ================================

  app.post("/application/:applicationId/assign", async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { employeeId } = req.body;
  
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "employeeId is required to assign the application",
        });
      }
  
      // Update application with assigned employee
      const updatedApplication = await prisma.application.update({
        where: { applicationId },
        data: { employeeId, 
            status: "Assigned" 
            }
      });
  
      res.json({
        success: true,
        message: "Application assigned successfully",
        application: updatedApplication,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });


  app.put("/application/:applicationId/reassign", async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { employeeId} = req.body;
  
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: "employeeId is required for reassignment",
        });
      }
  
      const application = await prisma.application.update({
        where: { applicationId },
        data: {
          employeeId,
          status: "Reassigned",
        },
      });
  
      res.json({
        success: true,
        message: "Application reassigned successfully",
        application,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/application/:applicationId/track-steps", async (req, res) => {
    try {
      const { applicationId } = req.params;
  
      const steps = await prisma.applicationTrackStep.findMany({
        where: { applicationId },
        orderBy: { order: "asc" }
      });
  
      res.json({
        success: true,
        steps
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  
    
  
  // ================================
  // UPDATE APPLICATION TRACK STEP
  // ================================
  app.post("/track-step/update/:trackId", async (req, res) => {
    try {
      const { trackId } = req.params;
      const { completed, updatedBy, remarks } = req.body;
  
      const step = await prisma.applicationTrackStep.update({
        where: { trackId },
        data: { completed, updatedBy, remarks },
      });
  
      res.json({
        success: true,
        message: "Track step updated successfully",
        step,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  



  app.put("/application/process", async (req, res) => {
    try {
      const { applicationId, finalRemark, finalDocument } = req.body;
  
      const updated = await prisma.application.update({
        where: { applicationId },
        data: {
          status: "Processed",
          finalRemark,
          finalDocument,
        },
      });
  
      res.json({
        success: true,
        message: "Application moved to admin verification",
        application: updated,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  
  app.put("/application/complete/:applicationId", async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { completedBy, remarks } = req.body;
  
      const updated = await prisma.application.update({
        where: { applicationId },
        data: {
          status: "Completed",
          adminRemarks: remarks,
          completedBy,
        },
      });
  
      res.json({
        success: true,
        message: "Application completed successfully",
        application: updated,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  
  app.get("/applications", async (req, res) => {
    try {
      const applications = await prisma.application.findMany({
        include: {
          trackSteps: true,
        },
      });
  
      res.json({ success: true, applications });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  
  app.get("/application/:applicationId", async (req, res) => {
    try {
      const { applicationId } = req.params;
  
      const appData = await prisma.application.findUnique({
        where: { applicationId },
        include: {
          trackSteps: {
            orderBy: { order: "asc" },
          },
          service: true,
          bundle: true,
          employee: true,
        },
      });
  
      res.json({ success: true, application: appData });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
  
  

  
 



/* -------------------- SERVER -------------------- */
app.listen(6001, () => {
  console.log(`✅ Insight Consulting Project Server running on port 6001`);
});
