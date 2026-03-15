const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const config = require('./config');
const path = require('path');


const s3Client = new S3Client({
  region: config.AWS_REGION, 
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey:config.AWS_SECRET_ACCESS_KEY,
  },
});


const serviceImgUpload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: config.S3_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      cb(null, `ServiceCardPhoto/${Date.now()}_${file.originalname}`);
    },
  }),
});


/* =========================
   COMMON INPUT FIELDS
========================= */

const defaultFields = [
  {
    label: "Full Name",
    type: "text",
    placeholder: "Enter full name",
    required: true,
  },
  {
    label: "Mobile Number",
    type: "text",
    placeholder: "Enter mobile number",
    required: true,
  },
  {
    label: "Email",
    type: "email",
    placeholder: "Enter email",
    required: true,
  },
  {
    label: "Aadhaar Card",
    type: "file",
    placeholder: "",
    required: true,
  }
];


/* =========================
   COMMON TRACK STEPS
========================= */

const defaultSteps = [
  {
    title: "Document Collection",
    order: 1,
    description: "Collect documents from client"
  },
  {
    title: "Application Preparation",
    order: 2,
    description: "Prepare application"
  },
  {
    title: "Application Submission",
    order: 3,
    description: "Submit application to authority"
  },
  {
    title: "Approval & Completion",
    order: 4,
    description: "Service completed"
  }
];


/* =========================
   SERVICE BENEFITS/POINTS
========================= */

const servicePoints = {
  // Registration Category - License and Certification Subcategory
  twelveARegistration: [
    "Eligibility Review & Documentation Preparation",
    "Dedicated Support for NGO / Trust / Society Registration",
    "Professional Income Tax & Compliance Consultation",
    "Complete 12A & 80G Application Filing Assistance"
  ],
  
  ngoDarpan: [
    "Complete NGO Darpan Documentation",
    "Dedicated Registration Support",
    "Accurate Portal Filing Assistance",
    "End-to-End NGO Darpan Registration"
  ],
  
  dsc: [
    "100% Online & Paperless Process",
    "Same-Day Shipping",
    "Secure & Compliant Certification",
    "End-to-End Assistance",
    "Hyper Token Enabled"
  ],
  
  // Statutory Registration Subcategory
  udyam: [
    "Official MSME Business Recognition",
    "Access Government Schemes & Subsidies",
    "Supports Tenders & Business Growth",
    "Fast Online Registration Support"
  ],
  
  // Business Registration Subcategory
  startupIndia: [
    "Eligibility Check & Consultation",
    "Document Collection & Review",
    "DPIIT Application Filing",
    "Government Review & Approval",
    "Startup Recognition Certificate Issued"
  ],

  // GST Services - Registration Subcategory
  gstRegistration: [
    "Complete Application Preparation",
    "Instant TRN Generation",
    "ARN Generation",
    "GST Certificate Issuance",
    "LEDGERS GST Software Access"
  ],
  
  gstRegistrationForeigners: [
    "Complete Application Preparation",
    "Instant TRN Generation",
    "ARN Generation",
    "GST Certificate Issuance",
    "LEDGERS GST Software Access"
  ],
  
  gstAmendment: [
    "GST Amendment Preparation & Review",
    "Online Filing on GST Portal",
    "Application Tracking & Acknowledgement",
    "Expert Compliance Verification"
  ],
  
  gstRevocation: [
    "Review of Cancellation Order",
    "Drafting Revocation Application",
    "Filing on GST Portal",
    "Follow-up & Approval Support"
  ],
  
  virtualOffice: [
    "Virtual Business Address",
    "Document Handling",
    "Fast Compliance",
    "100% Refund Guarantee"
  ],

  // GST Services - Filings Subcategory
  gstReturnFiling: [
    "GSTR-1 & GSTR-3B Filing",
    "GST Due Date Alerts",
    "GST Software Access",
    "Accountant-Managed Filing",
    "eInvoice & eWay Bill Support"
  ],
  
  gstLutFiling: [
    "Preparation of LUT Application",
    "Filing of LUT on GST Portal",
    "LUT Acknowledgement",
    "Export Without Payment of IGST"
  ],
  
  gstNoticeResponse: [
    "Expert Review of GST Notice",
    "Drafting & Filing Reply",
    "Deadline Tracking & Timely Response",
    "Representation & Compliance Support"
  ],
  
  gstAnnualReturn: [
    "Preparation of GSTR-9",
    "Filing on GST Portal",
    "Acknowledgement & Confirmation",
    "Expert Review & Compliance Check"
  ],
  
  gstr10Filing: [
    "Preparation of GSTR-10",
    "Filing on GST Portal",
    "Acknowledgement & Confirmation",
    "Expert Review & Compliance Check"
  ]
};


/* =========================
   CREATE MASTER FIELDS FIRST
========================= */

async function createMasterFields() {
  console.log("Creating master input fields...");
  
  const masterFields = [];
  
  for (const field of defaultFields) {
    const masterField = await prisma.masterInputField.create({
      data: {
        label: field.label,
        type: field.type,
        placeholder: field.placeholder,
        required: field.required,
        documentType: "GENERAL",
      }
    });
    masterFields.push(masterField);
  }
  
  return masterFields;
}


/* =========================
   CREATE SERVICE HELPER
========================= */

async function createService(serviceData, masterFields, points) {

  const service = await prisma.service.create({
    data: {
      ...serviceData,
      points: points // Add the points/benefits array
    }
  });

  /* create input fields with masterFieldId */
  
  await prisma.serviceInputField.createMany({
    data: defaultFields.map((field, index) => ({
      label: field.label,
      type: field.type,
      placeholder: field.placeholder,
      required: field.required,
      serviceId: service.serviceId,
      masterFieldId: masterFields[index].masterFieldId // Link to master field
    }))
  });

  /* create tracking steps with serviceId - Each service gets 4 steps */

  await prisma.serviceTrackStep.createMany({
    data: defaultSteps.map(step => ({
      title: step.title,
      order: step.order,
      description: step.description,
      serviceId: service.serviceId // Each step linked to this service
    }))
  });

  console.log(`  ✅ Created service: ${serviceData.name}`);
  return service;
}


/* =========================
   MAIN SEED
========================= */

async function main() {

  console.log("🌱 Seeding database...");
  console.log("================================");

  // First create master fields (these will be used by all services)
  const masterFields = await createMasterFields();
  console.log(`✅ Created ${masterFields.length} master input fields`);
  console.log("================================");

  /* CATEGORIES */

  console.log("Creating categories...");
  
  const registration = await prisma.category.create({
    data: { categoryName: "Registration" }
  });
  console.log(`  ✅ Created category: Registration`);

  const gstServices = await prisma.category.create({
    data: { categoryName: "GST Services" }
  });
  console.log(`  ✅ Created category: GST Services`);
  
  console.log("================================");


  /* SUB CATEGORIES */

  console.log("Creating sub-categories...");

  // Registration Category Subcategories
  const licenseCertification = await prisma.subCategory.create({
    data: {
      subCategoryName: "License and Certification",
      categoryId: registration.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: License and Certification under Registration`);

  const statutoryRegistration = await prisma.subCategory.create({
    data: {
      subCategoryName: "Statutory Registration",
      categoryId: registration.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Statutory Registration under Registration`);

  const businessRegistration = await prisma.subCategory.create({
    data: {
      subCategoryName: "Business Registration",
      categoryId: registration.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Business Registration under Registration`);

  // GST Services Subcategories
  const gstRegistrationSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Registration",
      categoryId: gstServices.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Registration under GST Services`);

  const gstFilingsSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Filings",
      categoryId: gstServices.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Filings under GST Services`);
  
  console.log("================================");


  /* =========================
     LOCAL IMAGE PATH FROM JAROMJERY FOLDER
  ========================= */
  const baseImagePath = '/assets/jaromjery/';

  /* SERVICES */

  console.log("Creating services with points...");

  // ==================== REGISTRATION CATEGORY ====================
  
  // License and Certification Subcategory
  await createService({
    name: "12A & 80G Registration",
    description: "Register your NGO, Trust, or Society under 12A and 80G to receive tax exemptions and enable tax benefits for donors. Our experts handle documentation and provide fast registration support across India.",
    photoUrl: `${baseImagePath}12a-80g-registration.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: licenseCertification.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.twelveARegistration);

  await createService({
    name: "NGO Darpan Registration",
    description: "Register your NGO on the NITI Aayog NGO Darpan Portal to access government grants and schemes. We provide complete documentation and hassle-free NGO Darpan registration support.",
    photoUrl: `${baseImagePath}ngo-darpan.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: licenseCertification.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.ngoDarpan);

  await createService({
    name: "Digital Signature Certificate (DSC)",
    description: "Buy a Digital Signature Certificate online from eMudhra or Care4Sign with same-day shipping. We provide end-to-end support for application, token download, and shipping.",
    photoUrl: `${baseImagePath}dsc.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: licenseCertification.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.dsc);

  // Statutory Registration Subcategory
  await createService({
    name: "Udyam (MSME) Registration",
    description: "Register under Udyam (MSME) Registration to access government schemes, subsidies, easier loans, and priority business opportunities. Get your MSME certificate quickly with expert support and smooth online processing.",
    photoUrl: `${baseImagePath}udyam.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: statutoryRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.udyam);

  // Business Registration Subcategory
  await createService({
    name: "Startup India Registration",
    description: "Start your journey toward funding opportunities, tax benefits, and national recognition. Register your startup under the Startup India Initiative and unlock long-term growth potential.",
    photoUrl: `${baseImagePath}startup-india.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: businessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.startupIndia);

  // ==================== GST SERVICES CATEGORY ====================
  
  // GST Registration Subcategory
  await createService({
    name: "GST Registration",
    description: "Register for GST online with expert assistance. We handle documentation, application filing, query resolution, and approval so you can focus on your business.",
    photoUrl: `${baseImagePath}gst-registration.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstRegistration);

  await createService({
    name: "GST Registration for Foreigners",
    description: "Foreign businesses supplying goods or services in India must register for GST. We assist with the complete registration process and compliance.",
    photoUrl: `${baseImagePath}gst-foreigners.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstRegistrationForeigners);

  await createService({
    name: "GST Amendment",
    description: "Update or modify GST registration details such as business name, address, partners, authorized signatory, or bank details.",
    photoUrl: `${baseImagePath}gst-amendment.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstAmendment);

  await createService({
    name: "GST Revocation",
    description: "If your GST registration was cancelled due to non-filing or other issues, apply for GST Revocation to restore your GST number and continue business legally.",
    photoUrl: `${baseImagePath}gst-revocation.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstRevocation);

  await createService({
    name: "Virtual Office + GSTIN",
    description: "Establish your business presence anywhere in India with a Virtual Office address and GST registration trusted by startups, freelancers, and SMEs.",
    photoUrl: `${baseImagePath}virtual-office.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.virtualOffice);

  // GST Filings Subcategory
  await createService({
    name: "GST Return Filing by Accountants",
    description: "Professional GST return filing covering GSTR-1 and GSTR-3B. Expert accountants manage filings using LEDGERS GST software for smooth and hassle-free compliance.",
    photoUrl: `${baseImagePath}gst-return.jpg`,
    serviceType: "RECURRING",
    frequency: "MONTHLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstFilingsSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstReturnFiling);

  await createService({
    name: "GST LUT Filing",
    description: "GST LUT allows exporters to supply goods or services without payment of IGST by submitting a Letter of Undertaking on the GST portal.",
    photoUrl: `${baseImagePath}gst-lut.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstFilingsSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstLutFiling);

  await createService({
    name: "GST Notice Response",
    description: "GST notices may be issued due to mismatches, non-filing, defective returns, or verification issues. Our professionals help analyze the notice and submit the correct response.",
    photoUrl: `${baseImagePath}gst-notice.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstFilingsSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstNoticeResponse);

  await createService({
    name: "GST Annual Return Filing (GSTR-9)",
    description: "GSTR-9 is the annual GST return filed by regular taxpayers. It consolidates all monthly or quarterly returns filed during the financial year.",
    photoUrl: `${baseImagePath}gstr-9.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstFilingsSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstAnnualReturn);

  await createService({
    name: "GSTR-10 Filing",
    description: "GSTR-10 is the final return that must be filed when GST registration is cancelled or surrendered.",
    photoUrl: `${baseImagePath}gstr-10.jpg`,
    serviceType: "ONE_TIME",
    individualPrice: "0",
    offerPrice: "0",
    isGstApplicable: "false",
    gstPercentage: "0",
    finalIndividualPrice: "0",
    subCategoryId: gstFilingsSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstr10Filing);

  console.log("================================");
  
  // Get counts for summary
  const categoriesCount = await prisma.category.count();
  const subCategoriesCount = await prisma.subCategory.count();
  const servicesCount = await prisma.service.count();
  const trackStepsCount = await prisma.serviceTrackStep.count();
  
  console.log("✅ Seeding completed successfully!");
  console.log(`📊 Summary:`);
  console.log(`  - Categories: ${categoriesCount}`);
  console.log(`  - Sub-categories: ${subCategoriesCount}`);
  console.log(`  - Services: ${servicesCount}`);
  console.log(`  - Master Input Fields: ${masterFields.length}`);
  console.log(`  - Service Input Fields: ${servicesCount * defaultFields.length}`);
  console.log(`  - Service Track Steps: ${trackStepsCount}`);
  console.log("================================");
}


main()
  .catch(e => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });