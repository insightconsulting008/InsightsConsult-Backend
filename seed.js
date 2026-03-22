const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const config = require('./src/utils/config');

// Remove all multer and S3 client imports - we don't need them for seeding

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
  ],

  // Compliance Category - Secretarial Compliance Subcategory
  partnershipCompliance: [
    "Income Tax Return Filing (ITR-5)",
    "Bookkeeping & Financial Statement Preparation",
    "GST & TDS Compliance Support",
    "Annual Compliance & Partner Reporting"
  ],

  proprietorshipCompliance: [
    "Income Tax Return Filing (ITR-3 / ITR-4)",
    "GST Return Filing & Reconciliation",
    "TDS Filing & Compliance Support",
    "Bookkeeping & Profit Computation"
  ],

  // MCA Category - Event Based Compliance Subcategory
  removeDirector: [
    "Legal Compliance",
    "MCA Filings",
    "Efficient Process",
    "Complete Documentation",
    "LEDGERS Accounting Software"
  ],

  companyNameChange: [
    "Check Company Name Availability",
    "MGT-14 and INC-24 Filings",
    "New Certificate of Incorporation",
    "LEDGERS Accounting Software"
  ],

  moaAmendment: [
    "MGT-14 / SH-7 / INC-24 / INC-22 Filings",
    "Board Resolution Preparation",
    "Dedicated Compliance Manager",
    "LEDGERS Accounting Software"
  ],

  aoaAmendment: [
    "MGT-14 Filing",
    "Board Resolution Preparation",
    "Dedicated Compliance Manager",
    "LEDGERS Accounting Software"
  ],

  // MCA Category - Secretarial Compliance Subcategory
  shareTransfer: [
    "Board Resolution Preparation",
    "Form SH-4 Documentation",
    "Dedicated Compliance Manager",
    "LEDGERS Accounting Software"
  ],

  dinReactivation: [
    "Form DIR-3 KYC (E-Form) Filing",
    "Professional Certification",
    "Compliance Setup",
    "LEDGERS Accounting Software"
  ],

  // Income Tax Category - Tax Filing Subcategory
  incomeTaxEFiling: [
    "Complete ITR preparation & review",
    "Form 16 & document verification",
    "Quick ITR filing & acknowledgement",
    "Expert support for notices",
    "Tax planning assistance"
  ],

  fifteenCAFifteenCB: [
    "CA Certificate (Form 15CB) Preparation",
    "Online Filing of Form 15CA",
    "Quick Processing for Foreign Remittance",
    "DTAA & TDS Compliance Verification"
  ],

  partnershipFirmITR: [
    "Complete ITR preparation & review",
    "Financial data review & reconciliation",
    "Quick ITR filing & acknowledgement",
    "Expert support for notices",
    "Tax planning assistance"
  ],

  companyITRFiling: [
    "Complete ITR preparation & review",
    "Financial data review & reconciliation",
    "Quick ITR filing & acknowledgement",
    "Expert support for notices",
    "Tax planning assistance"
  ],

  trustNgoTaxFiling: [
    "Complete ITR preparation & review",
    "Financial data review & reconciliation",
    "Quick ITR filing & acknowledgement",
    "Expert support for notices",
    "Tax planning assistance"
  ],

  revisedITR: [
    "Correction of errors in original ITR",
    "Income, deduction & tax credit updates",
    "Quick revised filing before due date",
    "Expert review & compliance check",
    "Support for tax notices & mismatches"
  ],

  // Income Tax Category - Taxation Subcategory
  businessTaxFiling: [
    "Complete ITR preparation & review",
    "Financial data review & reconciliation",
    "Quick ITR filing & acknowledgement",
    "Expert support for notices",
    "Tax planning assistance"
  ],

  tanRegistration: [
    "TAN Application Filing",
    "TAN Certificate and Number Issuance"
  ],

  tdsReturnFiling: [
    "Preparation & Validation of TDS Returns",
    "Quarterly Filing (24Q, 26Q, 27Q)",
    "Timely Filing & Acknowledgement",
    "Expert Compliance & Error Resolution"
  ],

  incomeTaxNotice: [
    "Expert Review of Tax Notice",
    "Drafting & Filing Reply to IT Department",
    "Deadline Tracking & Timely Response",
    "Representation & Compliance Support"
  ],

  // Startup Category - Business Registration Services
  proprietorship: [
    "Expert Registration Consultation",
    "End-to-End Documentation Support",
    "Dedicated Compliance Expert",
    "GST Registration & Monthly Filing Support",
    "Income Tax Return Filing Assistance"
  ],
  
  partnership: [
    "Partnership Deed Drafting",
    "PAN Card & GST Registration",
    "Income Tax & GST Return Filing",
    "Dedicated Compliance Expert"
  ],
  
  onePersonCompany: [
    "MCA Name Approval",
    "OPC Incorporation",
    "MOA & AOA Drafting",
    "PAN & TAN Registration"
  ],
  
  limitedLiabilityPartnership: [
    "MCA Name Approval",
    "LLP Incorporation",
    "LLP Agreement Drafting",
    "PAN & TAN Registration"
  ],
  
  privateLimitedCompany: [
    "MCA Name Approval",
    "Company Incorporation",
    "MOA & AOA Drafting",
    "PAN & TAN Registration"
  ],
  
  section8Company: [
    "MCA Name Approval",
    "Company Incorporation",
    "MOA & AOA Drafting",
    "PAN & TAN Registration"
  ],
  
  trustRegistration: [
    "Trust Deed Drafting",
    "PAN Card Registration",
    "Income Tax Filing",
    "Dedicated Compliance Expert"
  ],
  
  indianSubsidiary: [
    "MCA Name Approval",
    "Company Incorporation",
    "MOA & AOA Drafting",
    "PAN & TAN Registration"
  ],
  
  // MCA Additional Services
  companyCompliance: [
    "AOC-4",
    "MGT-7",
    "DIN-3 KYC",
    "ITR-6 Filing",
    "Dedicated Compliance Manager",
    "Automated Bookkeeping & Filing",
    "LEDGERS Accounting Software"
  ],
  
  llpCompliance: [
    "Form 8 Filings",
    "Form 11 Filings",
    "ITR-5 Filings",
    "Dedicated Compliance Manager",
    "Automated Bookkeeping & Filing",
    "LEDGERS Accounting Software"
  ],
  
  opcCompliance: [
    "AOC-4",
    "MGT-7A",
    "DIN-3 KYC",
    "ITR-6 Filing",
    "Dedicated Compliance Manager",
    "Automated Bookkeeping & Filing",
    "LEDGERS Accounting Software"
  ],
  
  registeredOfficeChange: [
    "INC-22 & MGT-14 Filing",
    "Drafting Resolutions & NOC",
    "Auto-Update Reminders",
    "LEDGERS Accounting Software"
  ],
  
  dinEkycFiling: [
    "DIR-3 KYC Filing",
    "Triennial KYC Cycle Management",
    "Professional Certification",
    "LEDGERS Accounting Software"
  ],
  
  directorChange: [
    "Online DIR-12 Filings",
    "Board Resolution preparation",
    "DIN & Director KYC support",
    "Dedicated Compliance Manager",
    "LEDGERS Accounting Software"
  ],
  
  adt1Filing: [
    "ADT-1 Filings",
    "Board Resolution Preparation",
    "Consent Drafting",
    "LEDGERS Accounting Software"
  ],
  
  dpt3Filing: [
    "DPT-3 Filings",
    "Expert Loan Classification",
    "Dedicated Compliance Manager",
    "LEDGERS Accounting Software"
  ],
  
  llpForm11Filing: [
    "Form 11 filings",
    "Compliance report",
    "Dedicated Compliance Manager",
    "LEDGERS Accounting Software"
  ],
  
  dormantStatusFiling: [
    "MSC 1 Filings",
    "Board resolution Preparation",
    "Dedicated Compliance Manager",
    "LEDGERS Accounting Software"
  ],
  
  authorizedCapitalIncrease: [
    "EGM report preparation",
    "SH-7 Filings",
    "Dedicated Compliance Manager",
    "LEDGERS Accounting Software"
  ],
  
  windingUpLLP: [
    "LLP Closure Documentation",
    "LLP Closure",
    "Liquidation Filing",
    "LLP Agreement Update",
    "Compliance Ready"
  ],
  
  windingUpCompany: [
    "Accounts Finalisation",
    "Winding Up Drafting",
    "Winding up Filing",
    "Include MGT-14 Fees"
  ],
  
  commencement: [
    "Regulatory Compliance",
    "Obtaining Necessary Licenses",
    "Fulfilling Share Capital Requirements",
    "Official Start of Business Activities"
  ],
  
  ccfsScheme: [
    "AOC-4",
    "MGT-7",
    "ITR-6 Filing",
    "Dedicated Compliance Manager",
    "Automated Bookkeeping & Filing",
    "LEDGERS Accounting Software"
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

  const incomeTax = await prisma.category.create({
    data: { categoryName: "Income Tax" }
  });
  console.log(`  ✅ Created category: Income Tax`);

  const compliance = await prisma.category.create({
    data: { categoryName: "Compliance" }
  });
  console.log(`  ✅ Created category: Compliance`);

  const mca = await prisma.category.create({
    data: { categoryName: "MCA" }
  });
  console.log(`  ✅ Created category: MCA`);
  
  const startup = await prisma.category.create({
    data: { categoryName: "Startup" }
  });
  console.log(`  ✅ Created category: Startup`);
  
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

  // Income Tax Category Subcategories
  const taxFilingSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Tax Filing",
      categoryId: incomeTax.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Tax Filing under Income Tax`);

  const taxationSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Taxation",
      categoryId: incomeTax.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Taxation under Income Tax`);

  // Compliance Category Subcategories
  const secretarialCompliance = await prisma.subCategory.create({
    data: {
      subCategoryName: "Secretarial Compliance",
      categoryId: compliance.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Secretarial Compliance under Compliance`);

  // MCA Category Subcategories
  const mcaEventBasedCompliance = await prisma.subCategory.create({
    data: {
      subCategoryName: "Event Based Compliance",
      categoryId: mca.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Event Based Compliance under MCA`);

  const mcaSecretarialCompliance = await prisma.subCategory.create({
    data: {
      subCategoryName: "Secretarial Compliance",
      categoryId: mca.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Secretarial Compliance under MCA`);

  // Startup Category Subcategories
  const startupBusinessRegistration = await prisma.subCategory.create({
    data: {
      subCategoryName: "Business Registration",
      categoryId: startup.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Business Registration under Startup`);
  
  console.log("================================");


  /* =========================
     SINGLE S3 IMAGE URL FOR ALL SERVICES
  ========================= */
  const s3ImageUrl = "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png";

  /* SERVICES */

  console.log("Creating services with points...");

  // ==================== REGISTRATION CATEGORY ====================
  
  // License and Certification Subcategory
  await createService({
    name: "12A & 80G Registration",
    description: "Register your NGO, Trust, or Society under 12A and 80G to receive tax exemptions and enable tax benefits for donors. Our experts handle documentation and provide fast registration support across India.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "6999",
    offerPrice: "5999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7079",
    subCategoryId: licenseCertification.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.twelveARegistration);

  await createService({
    name: "NGO Darpan Registration",
    description: "Register your NGO on the NITI Aayog NGO Darpan Portal to access government grants and schemes. We provide complete documentation and hassle-free NGO Darpan registration support.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "4999",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: licenseCertification.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.ngoDarpan);

  await createService({
    name: "Digital Signature Certificate (DSC)",
    description: "Buy a Digital Signature Certificate online from eMudhra or Care4Sign with same-day shipping. We provide end-to-end support for application, token download, and shipping.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "2499",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: licenseCertification.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.dsc);

  // Statutory Registration Subcategory
  await createService({
    name: "Udyam (MSME) Registration",
    description: "Register under Udyam (MSME) Registration to access government schemes, subsidies, easier loans, and priority business opportunities. Get your MSME certificate quickly with expert support and smooth online processing.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "2499",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1769",
    subCategoryId: statutoryRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.udyam);

  // Business Registration Subcategory
  await createService({
    name: "Startup India Registration",
    description: "Start your journey toward funding opportunities, tax benefits, and national recognition. Register your startup under the Startup India Initiative and unlock long-term growth potential.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "7999",
    offerPrice: "6999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "8258",
    subCategoryId: businessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.startupIndia);

  // ==================== GST SERVICES CATEGORY ====================
  
  // GST Registration Subcategory
  await createService({
    name: "GST Registration",
    description: "Register for GST online with expert assistance. We handle documentation, application filing, query resolution, and approval so you can focus on your business.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstRegistration);

  await createService({
    name: "GST Registration for Foreigners",
    description: "Foreign businesses supplying goods or services in India must register for GST. We assist with the complete registration process and compliance.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "9999",
    offerPrice: "8999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "10619",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstRegistrationForeigners);

  await createService({
    name: "GST Amendment",
    description: "Update or modify GST registration details such as business name, address, partners, authorized signatory, or bank details.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "2999",
    offerPrice: "2499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2949",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstAmendment);

  await createService({
    name: "GST Revocation",
    description: "If your GST registration was cancelled due to non-filing or other issues, apply for GST Revocation to restore your GST number and continue business legally.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "4999",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstRevocation);

  await createService({
    name: "Virtual Office + GSTIN",
    description: "Establish your business presence anywhere in India with a Virtual Office address and GST registration trusted by startups, freelancers, and SMEs.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "6999",
    offerPrice: "5999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7079",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.virtualOffice);

  // GST Filings Subcategory
  await createService({
    name: "GST Return Filing by Accountants",
    description: "Professional GST return filing covering GSTR-1 and GSTR-3B. Expert accountants manage filings using LEDGERS GST software for smooth and hassle-free compliance.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "MONTHLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "9999",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: gstFilingsSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstReturnFiling);

  await createService({
    name: "GST LUT Filing",
    description: "GST LUT allows exporters to supply goods or services without payment of IGST by submitting a Letter of Undertaking on the GST portal.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "1999",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1769",
    subCategoryId: gstFilingsSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstLutFiling);

  await createService({
    name: "GST Notice Response",
    description: "GST notices may be issued due to mismatches, non-filing, defective returns, or verification issues. Our professionals help analyze the notice and submit the correct response.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: gstRegistrationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstNoticeResponse);

  await createService({
    name: "GST Annual Return Filing (GSTR-9)",
    description: "GSTR-9 is the annual GST return filed by regular taxpayers. It consolidates all monthly or quarterly returns filed during the financial year.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: gstFilingsSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstAnnualReturn);

  await createService({
    name: "GSTR-10 Filing",
    description: "GSTR-10 is the final return that must be filed when GST registration is cancelled or surrendered.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "2999",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: gstFilingsSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstr10Filing);

  // ==================== INCOME TAX CATEGORY ====================
  
  // Tax Filing Subcategory
  await createService({
    name: "Income Tax E-Filing",
    description: "File your Income Tax Return online with dedicated tax experts from IndiaFilings. We handle document verification, tax computation, filing, and compliance — so you can stay stress-free.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "2999",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: taxFilingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.incomeTaxEFiling);

  await createService({
    name: "15CA – 15CB Filing",
    description: "Form 15CA and Form 15CB filing is mandatory for making payments to non-residents under the Income Tax Act. We assist with tax determination, DTAA benefit analysis, CA certification, and online filing to ensure hassle-free foreign remittance compliance.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: taxFilingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.fifteenCAFifteenCB);

  await createService({
    name: "Partnership Firm / LLP ITR Filing",
    description: "File Income Tax Returns for Partnership Firms or LLPs with expert guidance. We ensure accurate computation, documentation verification, and smooth filing with the Income Tax Department.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "4999",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: taxFilingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.partnershipFirmITR);

  await createService({
    name: "Company ITR Filing",
    description: "File your company Income Tax Return online with professional assistance. Our experts handle financial review, tax computation, filing, and compliance.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "6999",
    offerPrice: "5999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7079",
    subCategoryId: taxFilingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.companyITRFiling);

  await createService({
    name: "Trust / NGO Tax Filing",
    description: "File Income Tax Returns for Trusts or NGOs with expert assistance. We handle documentation verification, tax computation, and compliance to ensure smooth filing.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "5999",
    offerPrice: "4999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5898",
    subCategoryId: taxFilingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.trustNgoTaxFiling);

  await createService({
    name: "Revised ITR Return (ITR-U)",
    description: "Easily file your Revised Income Tax Return online with expert assistance. We help correct errors, update financial details, and ensure accurate compliance with the Income Tax Department.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "2999",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: taxFilingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.revisedITR);

  // Taxation Subcategory
  await createService({
    name: "Business Tax Filing",
    description: "File your business Income Tax Return online with expert assistance. We manage document verification, financial review, tax computation, filing, and compliance to keep your business tax-ready.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: taxationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.businessTaxFiling);

  await createService({
    name: "TAN Registration",
    description: "TAN (Tax Deduction and Collection Account Number) is a 10-digit alphanumeric number issued by the Income Tax Department. It must be obtained by all persons responsible for deducting or collecting tax at source.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "1499",
    offerPrice: "999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1179",
    subCategoryId: taxationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.tanRegistration);

  await createService({
    name: "TDS Return Filing",
    description: "TDS Return Filing is mandatory for deductors to report tax deducted at source to the Income Tax Department. We assist with accurate computation, challan matching, correction returns, and timely quarterly filing to avoid penalties.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "QUARTERLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "5999",
    offerPrice: "4999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5898",
    subCategoryId: taxationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.tdsReturnFiling);

  await createService({
    name: "Income Tax Notice",
    description: "Income Tax Notices may be issued due to mismatches, non-filing, defective returns, or verification issues. Our professionals help you understand the notice, prepare replies, submit documents, and ensure proper compliance.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: taxationSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.incomeTaxNotice);

  // ==================== COMPLIANCE CATEGORY ====================
  
  // Secretarial Compliance Subcategory
  await createService({
    name: "Partnership Compliance",
    description: "Partnership Firm compliance includes Income Tax Return filing (ITR-5), GST returns, TDS filings, accounting maintenance, and other statutory obligations. Our experts ensure accurate filing and timely compliance to avoid penalties and notices.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "9999",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: secretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.partnershipCompliance);

  await createService({
    name: "Proprietorship Compliance",
    description: "Proprietorship compliance includes Income Tax Return filing under ITR-3 or ITR-4, GST return filing, TDS compliance, and maintenance of books of accounts. We ensure accurate reporting and timely filing to help you avoid penalties and notices.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "7999",
    offerPrice: "5999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7079",
    subCategoryId: secretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.proprietorshipCompliance);

  // ==================== MCA CATEGORY ====================
  
  // Event Based Compliance Subcategory
  await createService({
    name: "Remove Director",
    description: "Director removal is required when a company decides to remove an existing director from its Board. This may occur due to resignation, disqualification, or internal company decisions. The process must comply with the Companies Act, 2013 and requires proper MCA filings.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "4999",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.removeDirector);

  await createService({
    name: "Company Name Change",
    description: "Easily change your company name with expert assistance. We handle MCA filing, Board Resolution, and MOA/AOA updates to help you obtain a fresh Certificate of Incorporation legally.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "5999",
    offerPrice: "4999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5898",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.companyNameChange);

  await createService({
    name: "MOA Amendment",
    description: "MOA Amendment is required when a company changes its name, business objects, registered office state, or authorised share capital. The alteration must be approved by shareholders and filed with the Ministry of Corporate Affairs (MCA).",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "6999",
    offerPrice: "5999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7079",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.moaAmendment);

  await createService({
    name: "AOA Amendment",
    description: "AOA Amendment is required to modify a company's Articles of Association, including changes in shareholding, director rights, or governance structure. The amendment must be approved by shareholders and filed with MCA.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "6999",
    offerPrice: "5999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7079",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.aoaAmendment);

  await createService({
    name: "Registered Office Change",
    description: "Change your company's registered address in 3 easy steps. Get expert help with INC-22 filings, drafting, and NOC preparation. Ensure your new address is updated on the MCA portal quickly to avoid penalties.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "4999",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.registeredOfficeChange);

  await createService({
    name: "Director Change",
    description: "The appointment of director is required when a company adds a new individual to its Board. This may be due to business growth, investor requirements, or the need for domain expertise. The director must have a valid DIN and give written consent to act as a director.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "5999",
    offerPrice: "4999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5898",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.directorChange);

  await createService({
    name: "Dormant Status Filing",
    description: "A Dormant Company is a registered company that has no significant accounting transactions and applies for dormant status under the Companies Act, 2013. Such companies must file annual compliance forms with the Ministry of Corporate Affairs (MCA) to retain dormant status and avoid penalties.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.dormantStatusFiling);

  await createService({
    name: "Authorized Capital Increase",
    description: "Increasing a company's authorized share capital enables it to issue more shares or raise funds. The process requires board and shareholder approval, followed by filing with the MCA to maintain compliance under the Companies Act, 2013.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "7999",
    offerPrice: "6999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "8258",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.authorizedCapitalIncrease);

  await createService({
    name: "Winding Up – LLP",
    description: "Initiate the process of winding up your LLP, including liquidation, dissolution, and closure procedures.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "14999",
    offerPrice: "12999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "15339",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.windingUpLLP);

  await createService({
    name: "Winding Up – Company",
    description: "Close your company or LLP legally and efficiently. Get expert assistance for striking off your company name from the MCA register with complete documentation support.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "19999",
    offerPrice: "16999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "20059",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.windingUpCompany);

  await createService({
    name: "Commencement (INC-20A)",
    description: "Start your business legally with ease by completing the required regulatory processes. Our expert team guides you through obtaining necessary licenses and fulfilling compliance requirements, ensuring a smooth commencement of operations from day one.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: mcaEventBasedCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.commencement);

  // MCA Secretarial Compliance Subcategory
  await createService({
    name: "Share Transfer",
    description: "Share transfer is the legal process of transferring company ownership. It must comply with the Companies Act, 2013 and be recorded in the register of members to ensure proper corporate compliance.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.shareTransfer);

  await createService({
    name: "DIN Reactivation",
    description: "Reactivate your deactivated DIN quickly by filing DIR-3 KYC with MCA. This ensures directors avoid disqualification and maintain compliance under the Companies Act.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "1999",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1769",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.dinReactivation);

  await createService({
    name: "Company Compliance",
    description: "Company Annual Filing, mandated by the Companies Act, 2013, requires all registered companies, including Private Limited, to submit financial statements (AOC-4) and annual returns (MGT-7/MGT-7A) to the Registrar of Companies.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "14999",
    offerPrice: "11999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "14158",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.companyCompliance);

  await createService({
    name: "LLP Compliance",
    description: "LLPs must comply with the Limited Liability Partnership Act, 2008 by filing Form 8 and Form 11 annually with the MCA. Timely filing keeps your LLP legally compliant and penalty-free.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "9999",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.llpCompliance);

  await createService({
    name: "OPC Compliance",
    description: "OPC Annual Filing, mandated by the Companies Act, 2013, requires all registered One Person Companies to submit financial statements (AOC-4) and annual returns (MGT-7A) to the Registrar of Companies.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "7999",
    offerPrice: "5999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7079",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.opcCompliance);

  await createService({
    name: "DIN eKYC Filing",
    description: "File your DIN eKYC (DIR-3 KYC) online with MCA to keep your DIN active and compliant. Avoid DIN deactivation and the ₹5,000 penalty with timely filing under the Companies Act, 2013. Our experts ensure smooth verification and MCA submission.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "1499",
    offerPrice: "999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1179",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.dinEkycFiling);

  await createService({
    name: "ADT-1 Filing",
    description: "ADT-1 filing is mandatory for companies to intimate the appointment or reappointment of an auditor to the Ministry of Corporate Affairs (MCA) under the Companies Act, 2013. The form must be filed within 15 days of the auditor's appointment to ensure statutory compliance.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "1999",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1769",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.adt1Filing);

  await createService({
    name: "DPT-3 Filing",
    description: "DPT-3 filing is mandatory for companies to report outstanding loans, deposits, or exempted borrowings to the MCA. It must be filed annually to comply with deposit rules under the Companies Act, 2013.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "2999",
    offerPrice: "2499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2949",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.dpt3Filing);

  await createService({
    name: "LLP Form 11 Filing",
    description: "Form 11 is a mandatory annual return filing for all registered LLPs with the MCA under the LLP Act, 2008. It must be filed every year to maintain compliance and avoid penalties.",
    photoUrl: s3ImageUrl,
    serviceType: "RECURRING",
    frequency: "YEARLY",
    duration: "1",
    durationUnit: "YEAR",
    individualPrice: "3999",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.llpForm11Filing);

  await createService({
    name: "CCFS Scheme",
    description: "File your MCA compliance before 15th July 2026 to get a 90% penalty waiver. Resolve your overdue returns and avoid heavy penalties.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "4999",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: mcaSecretarialCompliance.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.ccfsScheme);

  // ==================== STARTUP CATEGORY ====================
  
  // Business Registration Subcategory
  await createService({
    name: "Proprietorship",
    description: "Proprietorship registration in India is the easiest way to start a single-owner business, and we provide complete proprietorship registration services including GST, Udyam, and bank account setup for a fast and compliant business launch.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "4999",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: startupBusinessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields, servicePoints.proprietorship);

  await createService({
    name: "Partnership",
    description: "Register your Partnership Firm in India with complete legal support, including partnership deed drafting, PAN & GST registration, and ongoing compliance assistance for a smooth business setup.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "5999",
    offerPrice: "4999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5898",
    subCategoryId: startupBusinessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields, servicePoints.partnership);

  await createService({
    name: "One Person Company",
    description: "Register your One Person Company (OPC) in India with expert assistance. Get MCA name approval, MOA & AOA drafting, PAN & TAN registration, and complete compliance support to start your business legally.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "9999",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: startupBusinessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields, servicePoints.onePersonCompany);

  await createService({
    name: "Limited Liability Partnership",
    description: "Register your Limited Liability Partnership (LLP) in India with expert assistance. Get MCA name approval, LLP incorporation, LLP Agreement drafting, PAN & TAN registration, and complete compliance support to start your business legally.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "14999",
    offerPrice: "12999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "15339",
    subCategoryId: startupBusinessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields, servicePoints.limitedLiabilityPartnership);

  await createService({
    name: "Private Limited Company",
    description: "Register your Private Limited Company in India with expert assistance. Get name approval, MOA & AOA drafting, PAN & TAN registration, GST registration, and complete compliance support to start your business legally.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "19999",
    offerPrice: "15999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "18879",
    subCategoryId: startupBusinessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields, servicePoints.privateLimitedCompany);

  await createService({
    name: "Section 8 Company",
    description: "Register a Section 8 Company in India with expert assistance. Includes MCA name approval, MOA & AOA drafting, PAN & TAN registration, and statutory compliance support. Start your non-profit legally today.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "14999",
    offerPrice: "12999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "15339",
    subCategoryId: startupBusinessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields, servicePoints.section8Company);

  await createService({
    name: "Trust Registration",
    description: "Register a Trust in India with expert assistance including Trust Deed drafting, PAN registration, and statutory compliance support to start your non-profit legally today.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "9999",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: startupBusinessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields, servicePoints.trustRegistration);

  await createService({
    name: "Indian Subsidiary",
    description: "Set up an Indian Subsidiary Company with expert advisory. Get FDI-compliant incorporation, MOA & AOA, PAN, TAN, RBI filings, and ongoing compliance support. Expand your business into India seamlessly.",
    photoUrl: s3ImageUrl,
    serviceType: "ONE_TIME",
    individualPrice: "29999",
    offerPrice: "24999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "29499",
    subCategoryId: startupBusinessRegistration.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields, servicePoints.indianSubsidiary);

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

  //update seed march-21 sat