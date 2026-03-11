const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

async function createService(serviceData, masterFields) {

  const service = await prisma.service.create({
    data: serviceData
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

  console.log(`  ✅ Created service: ${serviceData.name} with ${defaultSteps.length} track steps`);
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
  
  const tax = await prisma.category.create({
    data: { categoryName: "Tax Services" }
  });
  console.log(`  ✅ Created category: Tax Services`);

  const business = await prisma.category.create({
    data: { categoryName: "Business Registration" }
  });
  console.log(`  ✅ Created category: Business Registration`);

  const license = await prisma.category.create({
    data: { categoryName: "Licenses & Compliance" }
  });
  console.log(`  ✅ Created category: Licenses & Compliance`);

  const legal = await prisma.category.create({
    data: { categoryName: "Legal Services" }
  });
  console.log(`  ✅ Created category: Legal Services`);

  const finance = await prisma.category.create({
    data: { categoryName: "Financial Services" }
  });
  console.log(`  ✅ Created category: Financial Services`);

  const hr = await prisma.category.create({
    data: { categoryName: "HR & Payroll" }
  });
  console.log(`  ✅ Created category: HR & Payroll`);

  const realEstate = await prisma.category.create({
    data: { categoryName: "Real Estate Services" }
  });
  console.log(`  ✅ Created category: Real Estate Services`);
  
  console.log("================================");


  /* SUB CATEGORIES (belong to categories) */

  console.log("Creating sub-categories...");

  // Tax Services Sub-categories
  const gstSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "GST Services",
      categoryId: tax.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: GST Services under Tax Services`);

  const incomeTaxSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Income Tax",
      categoryId: tax.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Income Tax under Tax Services`);

  const taxFilingSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Tax Filing",
      categoryId: tax.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Tax Filing under Tax Services`);

  const taxPlanningSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Tax Planning",
      categoryId: tax.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Tax Planning under Tax Services`);

  // Business Registration Sub-categories
  const companySub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Company Registration",
      categoryId: business.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Company Registration under Business Registration`);

  const msmeSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "MSME Registration",
      categoryId: business.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: MSME Registration under Business Registration`);

  const partnershipSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Partnership Firm",
      categoryId: business.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Partnership Firm under Business Registration`);

  const llpSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "LLP Registration",
      categoryId: business.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: LLP Registration under Business Registration`);

  const opcSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "One Person Company",
      categoryId: business.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: One Person Company under Business Registration`);

  const soleProprietorshipSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Sole Proprietorship",
      categoryId: business.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Sole Proprietorship under Business Registration`);

  const ngoSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "NGO Registration",
      categoryId: business.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: NGO Registration under Business Registration`);

  // Licenses & Compliance Sub-categories
  const foodSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Food License",
      categoryId: license.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Food License under Licenses & Compliance`);

  const tradeSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Trade License",
      categoryId: license.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Trade License under Licenses & Compliance`);

  const importExportSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Import Export Code",
      categoryId: license.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Import Export Code under Licenses & Compliance`);

  const professionalTaxSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Professional Tax",
      categoryId: license.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Professional Tax under Licenses & Compliance`);

  const shopSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Shop & Establishment",
      categoryId: license.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Shop & Establishment under Licenses & Compliance`);

  const pollutionSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Pollution Control",
      categoryId: license.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Pollution Control under Licenses & Compliance`);

  const fireSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Fire License",
      categoryId: license.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Fire License under Licenses & Compliance`);

  // Legal Services Sub-categories
  const trademarkSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Trademark & Copyright",
      categoryId: legal.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Trademark & Copyright under Legal Services`);

  const patentSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Patent Registration",
      categoryId: legal.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Patent Registration under Legal Services`);

  const contractSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Contract Drafting",
      categoryId: legal.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Contract Drafting under Legal Services`);

  const legalNoticesSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Legal Notices",
      categoryId: legal.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Legal Notices under Legal Services`);

  // Financial Services Sub-categories
  const accountingSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Accounting & Bookkeeping",
      categoryId: finance.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Accounting & Bookkeeping under Financial Services`);

  const auditSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Audit Services",
      categoryId: finance.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Audit Services under Financial Services`);

  // HR & Payroll Sub-categories
  const payrollSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Payroll Services",
      categoryId: hr.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Payroll Services under HR & Payroll`);

  const recruitmentSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Recruitment Services",
      categoryId: hr.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Recruitment Services under HR & Payroll`);

  // Real Estate Sub-categories
  const propertySub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Property Registration",
      categoryId: realEstate.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Property Registration under Real Estate Services`);

  const legalComplianceSub = await prisma.subCategory.create({
    data: {
      subCategoryName: "Legal Compliance",
      categoryId: realEstate.categoryId
    }
  });
  console.log(`  ✅ Created sub-category: Legal Compliance under Real Estate Services`);
  
  console.log("================================");


  /* SERVICES (belong to sub-categories) */

  console.log("Creating services with track steps...");

  // GST Services
  await createService({
    name: "GST Registration",
    description: "Register your business under GST",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: gstSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "GST Filing",
    description: "Monthly GST return filing",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "RECURRING",
    frequency: "MONTHLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "1500",
    offerPrice: "999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1178",
    subCategoryId: gstSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true",
    requiredDocuments: JSON.stringify([
      "Sales Invoice (Monthly)",
      "Purchase Invoice (Monthly)",
      "Bank Statement (Monthly)"
    ])
  }, masterFields);

  await createService({
    name: "GST Cancellation",
    description: "Cancel GST registration",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1299",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1532",
    subCategoryId: gstSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "GST Annual Return",
    description: "Annual GST return filing",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "3500",
    offerPrice: "2499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2948",
    subCategoryId: gstSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "GST Notice Reply",
    description: "Reply to GST notices",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: gstSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Income Tax Services
  await createService({
    name: "Income Tax Return Filing",
    description: "File your income tax returns",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "1500",
    offerPrice: "999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1178",
    subCategoryId: incomeTaxSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "TDS Return Filing",
    description: "File TDS returns",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "RECURRING",
    frequency: "QUARTERLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "2000",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: incomeTaxSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true",
    requiredDocuments: JSON.stringify([
      "TDS Challan (Quarterly)",
      "TDS Return Statement (Quarterly)",
      "PAN Cards of Deductees"
    ])
  }, masterFields);

  await createService({
    name: "Tax Planning & Consultation",
    description: "Expert tax planning advice",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: taxPlanningSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Company Registration Services
  await createService({
    name: "Private Limited Company Registration",
    description: "Register private limited company",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "12000",
    offerPrice: "8999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "10618",
    subCategoryId: companySub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Limited Liability Partnership (LLP)",
    description: "Register LLP",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "9000",
    offerPrice: "6999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "8258",
    subCategoryId: llpSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "One Person Company Registration",
    description: "Register OPC",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "8000",
    offerPrice: "5999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7078",
    subCategoryId: opcSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Partnership Firm Registration",
    description: "Register partnership firm",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: partnershipSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Sole Proprietorship Registration",
    description: "Register sole proprietorship",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: soleProprietorshipSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "NGO Registration",
    description: "Register NGO/Trust/Society",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "15000",
    offerPrice: "11999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "14158",
    subCategoryId: ngoSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // MSME Services
  await createService({
    name: "Udyam MSME Registration",
    description: "MSME registration",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "1500",
    offerPrice: "799",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "943",
    subCategoryId: msmeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "MSME Loan Assistance",
    description: "Get loans for MSME",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: msmeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "MSME Subsidy Application",
    description: "Apply for government subsidies",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "4000",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: msmeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Food License Services
  await createService({
    name: "FSSAI Registration",
    description: "Food license registration",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: foodSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "FSSAI Renewal",
    description: "Renew your food license",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: foodSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "FSSAI State License",
    description: "State level food license",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: foodSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "FSSAI Central License",
    description: "Central level food license",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "8000",
    offerPrice: "6499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7668",
    subCategoryId: foodSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Import Export Code
  await createService({
    name: "IEC Registration",
    description: "Import Export Code registration",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: importExportSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "IEC Modification",
    description: "Modify Import Export Code",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1299",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1532",
    subCategoryId: importExportSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Trade License
  await createService({
    name: "Trade License Registration",
    description: "Get trade license for business",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "4000",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: tradeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Trade License Renewal",
    description: "Renew your trade license",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: tradeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Shop & Establishment
  await createService({
    name: "Shop & Establishment Registration",
    description: "Register under Shop & Establishment Act",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: shopSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Shop & Establishment Renewal",
    description: "Renew shop license",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1299",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1532",
    subCategoryId: shopSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Professional Tax
  await createService({
    name: "Professional Tax Registration",
    description: "Register for professional tax",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "1500",
    offerPrice: "999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1178",
    subCategoryId: professionalTaxSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Professional Tax Filing",
    description: "File professional tax returns",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "RECURRING",
    frequency: "MONTHLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "1000",
    offerPrice: "699",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "825",
    subCategoryId: professionalTaxSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true",
    requiredDocuments: JSON.stringify([
      "Salary Register (Monthly)",
      "Employee List (Monthly)",
      "Challan (Monthly)"
    ])
  }, masterFields);

  // Trademark Services
  await createService({
    name: "Trademark Registration",
    description: "Register brand trademark",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "7000",
    offerPrice: "4999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5898",
    subCategoryId: trademarkSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Trademark Objection Reply",
    description: "Reply to trademark objections",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: trademarkSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Trademark Renewal",
    description: "Renew your trademark",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "6000",
    offerPrice: "4499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5308",
    subCategoryId: trademarkSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Copyright Registration",
    description: "Register your copyright",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "6000",
    offerPrice: "4499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5308",
    subCategoryId: trademarkSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Patent Services
  await createService({
    name: "Provisional Patent Application",
    description: "File provisional patent",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "10000",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: patentSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Complete Patent Application",
    description: "File complete patent",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "25000",
    offerPrice: "19999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "23598",
    subCategoryId: patentSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Patent Search",
    description: "Search for existing patents",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: patentSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Contract Drafting
  await createService({
    name: "Contract Drafting",
    description: "Draft legal contracts",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: contractSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Rental Agreement",
    description: "Draft rental agreement",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: contractSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Partnership Deed",
    description: "Draft partnership deed",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: contractSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Legal Notices
  await createService({
    name: "Legal Notice Drafting",
    description: "Draft legal notice",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1799",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2122",
    subCategoryId: legalNoticesSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Legal Notice Reply",
    description: "Reply to legal notice",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "2199",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2594",
    subCategoryId: legalNoticesSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Accounting Services
  await createService({
    name: "Monthly Accounting",
    description: "Complete monthly accounting",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "RECURRING",
    frequency: "MONTHLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: accountingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true",
    requiredDocuments: JSON.stringify([
      "Bank Statement (Monthly)",
      "Sales Invoices (Monthly)",
      "Purchase Invoices (Monthly)",
      "Expense Bills (Monthly)"
    ])
  }, masterFields);

  await createService({
    name: "Bookkeeping Services",
    description: "Daily bookkeeping",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "RECURRING",
    frequency: "MONTHLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "2000",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: accountingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true",
    requiredDocuments: JSON.stringify([
      "Bank Statement (Monthly)",
      "Credit Card Statement (Monthly)",
      "Receipts & Payments (Monthly)"
    ])
  }, masterFields);

  await createService({
    name: "Financial Statement Preparation",
    description: "Prepare financial statements",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: accountingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Audit Services
  await createService({
    name: "Statutory Audit",
    description: "Statutory audit of company",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "15000",
    offerPrice: "11999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "14158",
    subCategoryId: auditSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Internal Audit",
    description: "Internal audit services",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "RECURRING",
    frequency: "QUARTERLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: auditSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true",
    requiredDocuments: JSON.stringify([
      "Financial Statements (Quarterly)",
      "Ledger Reports (Quarterly)",
      "Compliance Reports (Quarterly)"
    ])
  }, masterFields);

  // Payroll Services
  await createService({
    name: "Payroll Processing",
    description: "Monthly payroll processing",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "RECURRING",
    frequency: "MONTHLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "2000",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: payrollSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true",
    requiredDocuments: JSON.stringify([
      "Attendance Sheet (Monthly)",
      "Salary Structure (Monthly)",
      "Employee Joining/Leaving (Monthly)"
    ])
  }, masterFields);

  await createService({
    name: "PF & ESI Registration",
    description: "Register for PF and ESI",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: payrollSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "PF & ESI Filing",
    description: "Monthly PF & ESI returns",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "RECURRING",
    frequency: "MONTHLY",
    duration: "12",
    durationUnit: "MONTH",
    individualPrice: "1000",
    offerPrice: "699",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "825",
    subCategoryId: payrollSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true",
    requiredDocuments: JSON.stringify([
      "PF Challan (Monthly)",
      "ESI Challan (Monthly)",
      "Employee Contribution Sheet (Monthly)"
    ])
  }, masterFields);

  // Recruitment Services
  await createService({
    name: "Recruitment Services",
    description: "Find the right candidates",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "10000",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: recruitmentSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Property Registration
  await createService({
    name: "Property Registration",
    description: "Register your property",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "10000",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: propertySub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  await createService({
    name: "Property Valuation",
    description: "Get property valuation",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: propertySub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Pollution Control
  await createService({
    name: "Pollution Control License",
    description: "Get pollution control license",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "8000",
    offerPrice: "6499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7668",
    subCategoryId: pollutionSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

  // Fire License
  await createService({
    name: "Fire License",
    description: "Get fire license",
    photoUrl: "https://insightconsulting.s3.ap-south-1.amazonaws.com/ServiceCardPhoto/Gemini_Generated_Image_lq3q4dlq3q4dlq3q.png",
    serviceType: "ONE_TIME",
    individualPrice: "6000",
    offerPrice: "4499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5308",
    subCategoryId: fireSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "true"
  }, masterFields);

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
  console.log(`  - Service Track Steps: ${trackStepsCount} (${defaultSteps.length} steps per service)`);
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