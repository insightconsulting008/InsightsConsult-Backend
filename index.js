const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const prisma = require('./src/prisma/prisma')
const categoryRouter = require("./src/category/Category");
const subcategoryRouter = require("./src/subCategory/SubCategory");
const masterFieldRouter = require("./src/masterFields/MasterInputField")
const serviceUpdate = require("./src/serviceUpdate/ServiceUpdate")
const authUserRouter = require("./src/userPortal/userAuth/userAuth")
const userApplicationApply = require("./src/userPortal/Application/Application")
const settings = require("./src/paymentSetting/PaymentSetting")
const {profileUpload,serviceImgUpload} = require("./src/utils/multer")
const {deleteS3Object} = require("./src/utils/deleteS3Object")
const blogs = require("./src/landingPage/blogs/Blogs")
const contact = require("./src/landingPage/contact/Contact")
const services = require("./src/landingPage/services/Services")
const accountSetting = require("./src/utils/AccountSetting")



/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://insightsconsult-frontend.onrender.com",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://insightconsultancy.netlify.app",
    "https://paatima.netlify.app"
  ], // frontend URL
  credentials: true
}));

/* -------------------- ROUTES -------------------- */
app.get("/test", async(req, res) => {
  res.json({
    message: "Insight Consulting Project Server is running 🚀"
  });
});


app.use("/",accountSetting)
// Use routers with prefixes
app.use("/", serviceUpdate)
app.use("/", categoryRouter);
app.use("/", subcategoryRouter);
app.use("/", masterFieldRouter)
app.use("/", subcategoryRouter);
app.use("/", authUserRouter);
app.use("/", userApplicationApply)
app.use("/", settings)
app.use("/", blogs)
app.use("/",contact)
app.use("/",services)




/* =====================================================
   EMPLOYEE CODE GENERATOR (nice ID)
===================================================== */

const generateEmployeeCode = async () => {
  const count = await prisma.employee.count();
  const next = count + 1;
  return `EMP${String(next).padStart(4, "0")}`;
};

/* -------------------- ROUTES -------------------- */


/* =====================================================
   DEPARTMENT APIs
===================================================== */

/** ✅ Dashboard Counts: departments, employees, active, inactive */
app.get("/dashboard/stats", async (req, res) => {
    try {
      const totalDepartments = await prisma.department.count();
  
      const totalEmployees = await prisma.employee.count();
  
      const activeEmployees = await prisma.employee.count({
        where: { status: "ACTIVE" }   // change field if your column name is different
      });
  
      const inactiveEmployees = await prisma.employee.count({
        where: { status: "INACTIVE" }
      });
  
      res.json({
        success: true,
        data: {
          totalDepartments,
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
        },
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

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
  

/** ✅ Get All Departments with Pagination */
app.get("/department", async (req, res) => {
    try {
      let { page, limit } = req.query;
  
      page = parseInt(page);
      limit = parseInt(limit);
  
      const skip = (page - 1) * limit;
  
      const departments = await prisma.department.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }  // Optional
      });
  
      const totalDepartments = await prisma.department.count();
  
      res.json({
        success: true,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalDepartments / limit),
        },
        data: departments,
      });
  
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

   // Prisma Foreign Key error code is P2003
   if (error.code === "P2003") {
     return res.status(400).json({
      success: false,
      message:
        "You cannot delete this department because employees are still assigned to it.",
    });
  }
   return res.status(500).json({ success: false, error: error.message });
    }
  });
  

/* =====================================================
   EMPLOYEE APIs
===================================================== */

/** ✅ Create Employee  **/
  app.post("/employee", profileUpload.single('photoUrl'), async (req, res) => {
    try {
 // ✅ Get image URL from S3
    const photoUrl = req.file.location;
      const {
        name,
        email,
        mobileNumber,
        role,
        designation,
        password,
        departmentId
      } = req.body;


      const employeeCode = await generateEmployeeCode();
     
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
          employeeCode,
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
      let { page, limit } = req.query;
  
      page = parseInt(page);
      limit = parseInt(limit);
  
      const skip = (page - 1) * limit;
  
      // Fetch employees with pagination
      const employees = await prisma.employee.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" } // optional
      });
  
      // Counts
      const totalEmployees = await prisma.employee.count();
      res.json({
        success: true,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalEmployees / limit),
        },
        data: employees,
      });
  
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
  app.put("/employee/:employeeId",profileUpload.single('photoUrl'), async (req, res) => {
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
        departmentId
      } = req.body;


        // 1️⃣ Check employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeId }
    });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
  
      // Optional: check department exists if departmentId is provided
      if (departmentId) {
        const department = await prisma.department.findUnique({ where: { departmentId } });
        if (!department) {
          return res.status(404).json({ success: false, message: "Department not found" });
        }
      }


      let photoUrl = existingEmployee.photoUrl;

      // 3️⃣ If new image uploaded
      if (req.file) {
        // delete old image
        if (existingEmployee.photoUrl) {
          await deleteS3Object(existingEmployee.photoUrl);
        }
  
        // save new image
        photoUrl = req.file.location;
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
   // 1️⃣ Check if employee exists
   const existingEmployee = await prisma.employee.findUnique({
    where: { employeeId }
  });

  if (!existingEmployee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found"
    });
  }

  // 2️⃣ Delete employee from DB
  await prisma.employee.delete({
    where: { employeeId }
  });

  // 3️⃣ Delete photo from S3 (if exists)
  if (existingEmployee.photoUrl) {
    await deleteS3Object(existingEmployee.photoUrl);
  }
      res.json({
        success: true,
        message: "Employee deleted successfully"
      });
  
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  


// =============================
// GET ALL SERVICES WITH INPUTFIELDS + TRACKSTEPS
// =============================
  app.get("/service", async (req, res) => {
    try {
      let { page, limit } = req.query;
  
      page = parseInt(page);
      limit = parseInt(limit);
  
      const skip = (page - 1) * limit;
  
      // Fetch services with pagination
      const services = await prisma.service.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }, // optional
      });
  
      // Total count
      const totalServices = await prisma.service.count();
  
      res.json({
        success: true,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalServices / limit),
          
        },
        data: services,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

  app.get("/service/:serviceId", async (req, res) => {
    const { serviceId } = req.params;
  
    try {
      const service = await prisma.service.findUnique({
        where: {
          serviceId, // make sure your model field name is correct
        },
        include: {
          inputFields: true,   
          trackSteps: true,
        },
      });
  
      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }
  
      res.json({ success: true, service });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

// =============================
// CREATE SERVICE
// =============================
app.post("/service",serviceImgUpload.single('photoUrl') ,async (req, res) => {
    try {
      const {  name, description, serviceType, frequency, duration, durationUnit,
        individualPrice, offerPrice, isGstApplicable, gstPercentage, finalIndividualPrice,
        subCategoryId, employeeId , requiredDocuments  } = req.body;
      const photoUrl = req.file.location 
       
    
      const service = await prisma.service.create({
        data: { name, description, photoUrl, serviceType, frequency, duration, durationUnit, individualPrice,
            offerPrice, isGstApplicable, gstPercentage, finalIndividualPrice, subCategoryId, employeeId , requiredDocuments },
      });
  
      res.json({ success: true, service });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  

app.post("/service/:serviceId/input-fields", async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { fields } = req.body; // array: [{ label, type, placeholder, required, masterFieldId }]
      console.log(fields)
      const createdFields = [];
  
      for (const f of fields) {
  
        let masterField;
  
        // -----------------------------------------
        // CASE 1: masterFieldId is given → use it
        // -----------------------------------------
        if (f.masterFieldId) {
          masterField = await prisma.masterInputField.findUnique({
            where: { masterFieldId: f.masterFieldId }
          });
  
          if (!masterField) {
            return res.status(400).json({
              success: false,
              message: `Master field not found: ${f.masterFieldId}`
            });
          }
        }
  
        // -----------------------------------------
        // CASE 2: No masterFieldId → create new Master input field
        // -----------------------------------------
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
  
        // -----------------------------------------
        // CREATE SERVICE INPUT FIELD (always)
        // -----------------------------------------
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
  
      res.json({ success: true, createdFields });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
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
              description: step.description,
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
      const { name, description, bundlePrice,  bundleOfferPrice,isGstApplicable,
        gstPercentage, serviceIds ,finalBundlePrice } = req.body;
    
      const bundle = await prisma.serviceBundle.create({
        data: {
          name,
          description,
          bundlePrice,
          bundleOfferPrice,
          isGstApplicable,
          gstPercentage,
          finalBundlePrice,
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
        return res.status(404).json({
          success: false,
          message: "Bundle not found",
        });
      }
  
      // 👉 Merge and remove duplicate input fields
      const allInputFields = bundle.services.flatMap(service => service.inputFields);
  
      const mergedInputFields = [];
      const seen = new Set();
  
      for (const field of allInputFields) {
        const key = field.label.trim().toLowerCase();
  
        if (!seen.has(key)) {
          seen.add(key);
  
          mergedInputFields.push({
            label: field.label,
            type: field.type,
            required: field.required,
            options: field.options
          });
        }
      }
  
      return res.json({
        success: true,
        bundle: {
          ...bundle,
          mergedInputFields  // <-- sending merged input fields
        }
      });
  
    } catch (error) {
      console.error("Error fetching bundle details:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
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
