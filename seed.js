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
  // GST Services
  gstRegistration: [
    "Get your business GST registered legally",
    "Input tax credit benefits on purchases",
    "Inter-state sales without restrictions",
    "Legal recognition as a supplier",
    "Compliance with tax laws"
  ],
  gstFiling: [
    "Timely filing of GST returns",
    "Avoid penalties and late fees",
    "Professional handling of all GSTR forms",
    "Reconciliation of sales and purchases",
    "Expert guidance on GST compliance"
  ],
  gstCancellation: [
    "Proper closure of GST registration",
    "Avoid future compliance requirements",
    "Expert handling of cancellation process",
    "Final return filing assistance",
    "Smooth business closure"
  ],
  gstAnnualReturn: [
    "Annual compliance fulfillment",
    "Accurate GSTR-9 filing",
    "Reconciliation of annual data",
    "Expert review of returns",
    "Avoid notices from department"
  ],
  gstNoticeReply: [
    "Expert handling of GST notices",
    "Proper documentation and response",
    "Avoid penalties and demands",
    "Representation before authorities",
    "Quick resolution of issues"
  ],

  // Income Tax Services
  incomeTaxReturn: [
    "Accurate income tax filing",
    "Maximize tax savings legally",
    "Avoid notices from IT department",
    "Quick processing of returns",
    "Expert tax consultation"
  ],
  tdsReturn: [
    "Timely TDS return filing",
    "Avoid interest and penalties",
    "Proper TDS reconciliation",
    "Issue Form 16/16A to employees",
    "Expert compliance management"
  ],
  taxPlanning: [
    "Strategic tax planning",
    "Legal tax saving methods",
    "Investment planning advice",
    "Retirement planning",
    "Wealth management strategies"
  ],

  // Company Registration
  privateLimited: [
    "Limited liability protection",
    "Separate legal entity status",
    "Easy fundraising ability",
    "Perpetual succession",
    "Credibility with stakeholders"
  ],
  llpRegistration: [
    "Limited liability to partners",
    "Lower compliance cost",
    "No minimum capital requirement",
    "Flexible management structure",
    "Separate legal entity"
  ],
  opcRegistration: [
    "Single owner business structure",
    "Limited liability protection",
    "Separate legal entity",
    "Easy to manage and operate",
    "Professional credibility"
  ],
  partnershipRegistration: [
    "Easy to form and operate",
    "Shared responsibility and risk",
    "Combined capital and skills",
    "Less compliance burden",
    "Flexible decision making"
  ],
  soleProprietorship: [
    "Complete control over business",
    "Easy to start and close",
    "Minimal compliance requirements",
    "All profits belong to owner",
    "Quick decision making"
  ],
  ngoRegistration: [
    "Legal status for social work",
    "Tax exemption benefits",
    "Eligible for grants and funding",
    "Credibility with donors",
    "Perpetual existence"
  ],

  // MSME Services
  msmeRegistration: [
    "Priority sector lending benefits",
    "Subsidy on various schemes",
    "Protection against delayed payments",
    "Concession in electricity bills",
    "Preference in government tenders"
  ],
  msmeLoan: [
    "Easy access to collateral-free loans",
    "Lower interest rates",
    "Government guarantee coverage",
    "Quick processing and disbursement",
    "Flexible repayment options"
  ],
  msmeSubsidy: [
    "Capital investment subsidy",
    "Technology upgradation benefits",
    "Marketing assistance",
    "Export promotion benefits",
    "Quality certification reimbursement"
  ],

  // Food License
  fssaiRegistration: [
    "Legal compliance for food business",
    "Build customer trust",
    "Avoid penalties and legal issues",
    "Quality assurance",
    "Business credibility"
  ],
  fssaiRenewal: [
    "Continuous business operations",
    "Maintain legal compliance",
    "Avoid business interruption",
    "Updated license validity",
    "Peace of mind"
  ],
  fssaiStateLicense: [
    "Medium scale business compliance",
    "State-wide operations permitted",
    "Higher business credibility",
    "Quality certification",
    "Market expansion"
  ],
  fssaiCentralLicense: [
    "Pan-India operations permitted",
    "Highest level of compliance",
    "International recognition",
    "Large business credibility",
    "Export-import benefits"
  ],

  // Import Export Code
  iecRegistration: [
    "Mandatory for import/export business",
    "Access to international markets",
    "Avail export benefits and schemes",
    "Custom clearance facilitation",
    "Foreign exchange earnings"
  ],
  iecModification: [
    "Keep IEC details updated",
    "Avoid issues in customs clearance",
    "Smooth import/export operations",
    "Compliance with DGFT requirements",
    "Business continuity"
  ],

  // Trade License
  tradeLicense: [
    "Legal permission to trade",
    "Compliance with municipal laws",
    "Avoid legal notices and penalties",
    "Business credibility",
    "Smooth business operations"
  ],
  tradeRenewal: [
    "Continuous business operations",
    "Maintain legal compliance",
    "Avoid business interruption",
    "Updated license validity",
    "Peace of mind"
  ],

  // Shop & Establishment
  shopRegistration: [
    "Legal compliance with state law",
    "Register employees for benefits",
    "Fixed business hours compliance",
    "Legal protection for business",
    "Avoid penalties"
  ],
  shopRenewal: [
    "Continuous compliance",
    "Avoid legal issues",
    "Updated registration",
    "Business continuity",
    "Legal protection"
  ],

  // Professional Tax
  professionalTaxReg: [
    "State law compliance",
    "Legal business operation",
    "Avoid penalties and notices",
    "Employee record maintenance",
    "Professional credibility"
  ],
  professionalTaxFiling: [
    "Timely tax payment",
    "Avoid interest and penalties",
    "Compliance certificate",
    "Proper record maintenance",
    "Peace of mind"
  ],

  // Trademark
  trademarkRegistration: [
    "Exclusive brand ownership",
    "Legal protection against infringement",
    "Brand asset creation",
    "Nationwide protection",
    "Business goodwill protection"
  ],
  trademarkObjection: [
    "Expert response to objections",
    "Protect your brand rights",
    "Legal representation",
    "Higher success rate",
    "Timely resolution"
  ],
  trademarkRenewal: [
    "Continuous brand protection",
    "Maintain exclusive rights",
    "Avoid trademark expiration",
    "Asset protection",
    "Business continuity"
  ],
  copyrightRegistration: [
    "Protect creative works",
    "Legal ownership proof",
    "Monetary damages in infringement",
    "Nationwide protection",
    "Intellectual property asset"
  ],

  // Patent
  provisionalPatent: [
    "Early filing date advantage",
    "12 months to develop invention",
    "'Patent Pending' status",
    "Lower initial cost",
    "Time to assess commercial value"
  ],
  completePatent: [
    "Full patent protection",
    "Exclusive monopoly rights",
    "Commercialize invention safely",
    "Asset creation",
    "Competitive advantage"
  ],
  patentSearch: [
    "Check patentability of invention",
    "Avoid infringement risks",
    "Save time and costs",
    "Prior art analysis",
    "Informed decision making"
  ],

  // Contract Drafting
  contractDrafting: [
    "Legally sound agreements",
    "Protect your interests",
    "Clear terms and conditions",
    "Dispute prevention",
    "Professional documentation"
  ],
  rentalAgreement: [
    "Legal protection for landlord/tenant",
    "Clear terms for rent and deposit",
    "Dispute resolution mechanism",
    "Proper documentation",
    "Legal compliance"
  ],
  partnershipDeed: [
    "Clear partner roles and duties",
    "Profit sharing terms",
    "Dispute resolution mechanism",
    "Legal validity",
    "Business clarity"
  ],

  // Legal Notices
  legalNoticeDrafting: [
    "Professional legal communication",
    "Proper legal format",
    "Clear demands and timelines",
    "Evidence for legal proceedings",
    "Cost-effective dispute resolution"
  ],
  legalNoticeReply: [
    "Expert response to notices",
    "Protect your legal rights",
    "Avoid unnecessary litigation",
    "Professional representation",
    "Timely response"
  ],

  // Accounting
  monthlyAccounting: [
    "Accurate financial records",
    "Timely management reports",
    "Tax compliance ready",
    "Business performance tracking",
    "Expert accounting support"
  ],
  bookkeeping: [
    "Daily transaction recording",
    "Bank reconciliation",
    "Expense tracking",
    "Financial clarity",
    "Ready for audits"
  ],
  financialStatements: [
    "Professional P&L and Balance Sheet",
    "Investor-ready reports",
    "Loan application support",
    "Business valuation basis",
    "Regulatory compliance"
  ],

  // Audit
  statutoryAudit: [
    "Legal compliance for companies",
    "Independent financial opinion",
    "Shareholder confidence",
    "Regulatory requirement met",
    "Fraud detection and prevention"
  ],
  internalAudit: [
    "Process improvement",
    "Risk identification",
    "Operational efficiency",
    "Internal control enhancement",
    "Management support"
  ],

  // Payroll
  payrollProcessing: [
    "Accurate salary calculation",
    "Timely employee payments",
    "Tax deduction compliance",
    "Payslip generation",
    "Employee satisfaction"
  ],
  pfEsiRegistration: [
    "Social security compliance",
    "Employee benefits registration",
    "Avoid legal penalties",
    "Statutory compliance",
    "Employee trust building"
  ],
  pfEsiFiling: [
    "Timely statutory filings",
    "Avoid interest and penalties",
    "Compliance certificates",
    "Proper record maintenance",
    "Peace of mind"
  ],

  // Recruitment
  recruitmentServices: [
    "Find right talent quickly",
    "Screening and shortlisting",
    "Interview coordination",
    "Skill assessment",
    "Quality candidate pipeline"
  ],

  // Property
  propertyRegistration: [
    "Legal ownership transfer",
    "Title clearance",
    "Avoid future disputes",
    "Proper documentation",
    "Government records update"
  ],
  propertyValuation: [
    "Accurate property worth",
    "Loan application support",
    "Sale/purchase assistance",
    "Investment decision help",
    "Expert valuation report"
  ],

  // Pollution Control
  pollutionControlLicense: [
    "Environmental compliance",
    "Avoid legal penalties",
    "Green business certification",
    "Sustainable operations",
    "Community goodwill"
  ],

  // Fire License
  fireLicense: [
    "Safety compliance",
    "Insurance validity",
    "Employee safety assurance",
    "Legal requirement met",
    "Emergency preparedness"
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


  /* =========================
     LOCAL IMAGE PATH
  ========================= */
  const baseImagePath = '/assets/service-images/default-service.jpg';

  /* SERVICES (belong to sub-categories) */

  console.log("Creating services with track steps and benefits...");

  // GST Services
  await createService({
    name: "GST Registration",
    description: "Register your business under GST",
    photoUrl: '/assets/service-images/gst-registration.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: gstSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstRegistration);

  await createService({
    name: "GST Filing",
    description: "Monthly GST return filing",
    photoUrl: '/assets/service-images/gst-filing.jpg',
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
    documentsRequired: "false"
  }, masterFields, servicePoints.gstFiling);

  await createService({
    name: "GST Cancellation",
    description: "Cancel GST registration",
    photoUrl: '/assets/service-images/gst-cancellation.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1299",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1532",
    subCategoryId: gstSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstCancellation);

  await createService({
    name: "GST Annual Return",
    description: "Annual GST return filing",
    photoUrl: '/assets/service-images/gst-annual.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "3500",
    offerPrice: "2499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2948",
    subCategoryId: gstSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstAnnualReturn);

  await createService({
    name: "GST Notice Reply",
    description: "Reply to GST notices",
    photoUrl: '/assets/service-images/gst-notice.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: gstSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.gstNoticeReply);

  // Income Tax Services
  await createService({
    name: "Income Tax Return Filing",
    description: "File your income tax returns",
    photoUrl: '/assets/service-images/income-tax.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "1500",
    offerPrice: "999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1178",
    subCategoryId: incomeTaxSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.incomeTaxReturn);

  await createService({
    name: "TDS Return Filing",
    description: "File TDS returns",
    photoUrl: '/assets/service-images/tds-filing.jpg',
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
    documentsRequired: "false"
  }, masterFields, servicePoints.tdsReturn);

  await createService({
    name: "Tax Planning & Consultation",
    description: "Expert tax planning advice",
    photoUrl: '/assets/service-images/tax-planning.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: taxPlanningSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.taxPlanning);

  // Company Registration Services
  await createService({
    name: "Private Limited Company Registration",
    description: "Register private limited company",
    photoUrl: '/assets/service-images/private-limited.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "12000",
    offerPrice: "8999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "10618",
    subCategoryId: companySub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.privateLimited);

  await createService({
    name: "Limited Liability Partnership (LLP)",
    description: "Register LLP",
    photoUrl: '/assets/service-images/llp-registration.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "9000",
    offerPrice: "6999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "8258",
    subCategoryId: llpSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.llpRegistration);

  await createService({
    name: "One Person Company Registration",
    description: "Register OPC",
    photoUrl: '/assets/service-images/opc-registration.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "8000",
    offerPrice: "5999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7078",
    subCategoryId: opcSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.opcRegistration);

  await createService({
    name: "Partnership Firm Registration",
    description: "Register partnership firm",
    photoUrl: '/assets/service-images/partnership.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: partnershipSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.partnershipRegistration);

  await createService({
    name: "Sole Proprietorship Registration",
    description: "Register sole proprietorship",
    photoUrl: '/assets/service-images/sole-proprietorship.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: soleProprietorshipSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.soleProprietorship);

  await createService({
    name: "NGO Registration",
    description: "Register NGO/Trust/Society",
    photoUrl: '/assets/service-images/ngo-registration.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "15000",
    offerPrice: "11999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "14158",
    subCategoryId: ngoSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.ngoRegistration);

  // MSME Services
  await createService({
    name: "Udyam MSME Registration",
    description: "MSME registration",
    photoUrl: '/assets/service-images/msme-registration.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "1500",
    offerPrice: "799",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "943",
    subCategoryId: msmeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.msmeRegistration);

  await createService({
    name: "MSME Loan Assistance",
    description: "Get loans for MSME",
    photoUrl: '/assets/service-images/msme-loan.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: msmeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.msmeLoan);

  await createService({
    name: "MSME Subsidy Application",
    description: "Apply for government subsidies",
    photoUrl: '/assets/service-images/msme-subsidy.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "4000",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: msmeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.msmeSubsidy);

  // Food License Services
  await createService({
    name: "FSSAI Registration",
    description: "Food license registration",
    photoUrl: '/assets/service-images/fssai-registration.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: foodSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.fssaiRegistration);

  await createService({
    name: "FSSAI Renewal",
    description: "Renew your food license",
    photoUrl: '/assets/service-images/fssai-renewal.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: foodSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.fssaiRenewal);

  await createService({
    name: "FSSAI State License",
    description: "State level food license",
    photoUrl: '/assets/service-images/fssai-state.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: foodSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.fssaiStateLicense);

  await createService({
    name: "FSSAI Central License",
    description: "Central level food license",
    photoUrl: '/assets/service-images/fssai-central.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "8000",
    offerPrice: "6499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7668",
    subCategoryId: foodSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.fssaiCentralLicense);

  // Import Export Code
  await createService({
    name: "IEC Registration",
    description: "Import Export Code registration",
    photoUrl: '/assets/service-images/iec-registration.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: importExportSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.iecRegistration);

  await createService({
    name: "IEC Modification",
    description: "Modify Import Export Code",
    photoUrl: '/assets/service-images/iec-modification.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1299",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1532",
    subCategoryId: importExportSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.iecModification);

  // Trade License
  await createService({
    name: "Trade License Registration",
    description: "Get trade license for business",
    photoUrl: '/assets/service-images/trade-license.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "4000",
    offerPrice: "2999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "3538",
    subCategoryId: tradeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.tradeLicense);

  await createService({
    name: "Trade License Renewal",
    description: "Renew your trade license",
    photoUrl: '/assets/service-images/trade-renewal.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: tradeSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.tradeRenewal);

  // Shop & Establishment
  await createService({
    name: "Shop & Establishment Registration",
    description: "Register under Shop & Establishment Act",
    photoUrl: '/assets/service-images/shop-establishment.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: shopSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.shopRegistration);

  await createService({
    name: "Shop & Establishment Renewal",
    description: "Renew shop license",
    photoUrl: '/assets/service-images/shop-renewal.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1299",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1532",
    subCategoryId: shopSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.shopRenewal);

  // Professional Tax
  await createService({
    name: "Professional Tax Registration",
    description: "Register for professional tax",
    photoUrl: '/assets/service-images/professional-tax.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "1500",
    offerPrice: "999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1178",
    subCategoryId: professionalTaxSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.professionalTaxReg);

  await createService({
    name: "Professional Tax Filing",
    description: "File professional tax returns",
    photoUrl: '/assets/service-images/professional-tax-filing.jpg',
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
    documentsRequired: "false"
  }, masterFields, servicePoints.professionalTaxFiling);

  // Trademark Services
  await createService({
    name: "Trademark Registration",
    description: "Register brand trademark",
    photoUrl: '/assets/service-images/trademark.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "7000",
    offerPrice: "4999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5898",
    subCategoryId: trademarkSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.trademarkRegistration);

  await createService({
    name: "Trademark Objection Reply",
    description: "Reply to trademark objections",
    photoUrl: '/assets/service-images/trademark-objection.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: trademarkSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.trademarkObjection);

  await createService({
    name: "Trademark Renewal",
    description: "Renew your trademark",
    photoUrl: '/assets/service-images/trademark-renewal.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "6000",
    offerPrice: "4499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5308",
    subCategoryId: trademarkSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.trademarkRenewal);

  await createService({
    name: "Copyright Registration",
    description: "Register your copyright",
    photoUrl: '/assets/service-images/copyright.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "6000",
    offerPrice: "4499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5308",
    subCategoryId: trademarkSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.copyrightRegistration);

  // Patent Services
  await createService({
    name: "Provisional Patent Application",
    description: "File provisional patent",
    photoUrl: '/assets/service-images/patent-provisional.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "10000",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: patentSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.provisionalPatent);

  await createService({
    name: "Complete Patent Application",
    description: "File complete patent",
    photoUrl: '/assets/service-images/patent-complete.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "25000",
    offerPrice: "19999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "23598",
    subCategoryId: patentSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.completePatent);

  await createService({
    name: "Patent Search",
    description: "Search for existing patents",
    photoUrl: '/assets/service-images/patent-search.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: patentSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.patentSearch);

  // Contract Drafting
  await createService({
    name: "Contract Drafting",
    description: "Draft legal contracts",
    photoUrl: '/assets/service-images/contract-drafting.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: contractSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.contractDrafting);

  await createService({
    name: "Rental Agreement",
    description: "Draft rental agreement",
    photoUrl: '/assets/service-images/rental-agreement.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: contractSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.rentalAgreement);

  await createService({
    name: "Partnership Deed",
    description: "Draft partnership deed",
    photoUrl: '/assets/service-images/partnership-deed.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "1999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2358",
    subCategoryId: contractSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.partnershipDeed);

  // Legal Notices
  await createService({
    name: "Legal Notice Drafting",
    description: "Draft legal notice",
    photoUrl: '/assets/service-images/legal-notice.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2500",
    offerPrice: "1799",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2122",
    subCategoryId: legalNoticesSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.legalNoticeDrafting);

  await createService({
    name: "Legal Notice Reply",
    description: "Reply to legal notice",
    photoUrl: '/assets/service-images/legal-notice-reply.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "3000",
    offerPrice: "2199",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "2594",
    subCategoryId: legalNoticesSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.legalNoticeReply);

  // Accounting Services
  await createService({
    name: "Monthly Accounting",
    description: "Complete monthly accounting",
    photoUrl: '/assets/service-images/monthly-accounting.jpg',
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
    documentsRequired: "false"
  }, masterFields, servicePoints.monthlyAccounting);

  await createService({
    name: "Bookkeeping Services",
    description: "Daily bookkeeping",
    photoUrl: '/assets/service-images/bookkeeping.jpg',
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
    documentsRequired: "false"
  }, masterFields, servicePoints.bookkeeping);

  await createService({
    name: "Financial Statement Preparation",
    description: "Prepare financial statements",
    photoUrl: '/assets/service-images/financial-statements.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: accountingSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.financialStatements);

  // Audit Services
  await createService({
    name: "Statutory Audit",
    description: "Statutory audit of company",
    photoUrl: '/assets/service-images/statutory-audit.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "15000",
    offerPrice: "11999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "14158",
    subCategoryId: auditSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.statutoryAudit);

  await createService({
    name: "Internal Audit",
    description: "Internal audit services",
    photoUrl: '/assets/service-images/internal-audit.jpg',
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
    documentsRequired: "false"
  }, masterFields, servicePoints.internalAudit);

  // Payroll Services
  await createService({
    name: "Payroll Processing",
    description: "Monthly payroll processing",
    photoUrl: '/assets/service-images/payroll.jpg',
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
    documentsRequired: "false"
  }, masterFields, servicePoints.payrollProcessing);

  await createService({
    name: "PF & ESI Registration",
    description: "Register for PF and ESI",
    photoUrl: '/assets/service-images/pf-esi-registration.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "2000",
    offerPrice: "1499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "1768",
    subCategoryId: payrollSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.pfEsiRegistration);

  await createService({
    name: "PF & ESI Filing",
    description: "Monthly PF & ESI returns",
    photoUrl: '/assets/service-images/pf-esi-filing.jpg',
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
    documentsRequired: "false"
  }, masterFields, servicePoints.pfEsiFiling);

  // Recruitment Services
  await createService({
    name: "Recruitment Services",
    description: "Find the right candidates",
    photoUrl: '/assets/service-images/recruitment.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "10000",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: recruitmentSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.recruitmentServices);

  // Property Registration
  await createService({
    name: "Property Registration",
    description: "Register your property",
    photoUrl: '/assets/service-images/property-registration.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "10000",
    offerPrice: "7999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "9438",
    subCategoryId: propertySub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.propertyRegistration);

  await createService({
    name: "Property Valuation",
    description: "Get property valuation",
    photoUrl: '/assets/service-images/property-valuation.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "5000",
    offerPrice: "3999",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "4718",
    subCategoryId: propertySub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.propertyValuation);

  // Pollution Control
  await createService({
    name: "Pollution Control License",
    description: "Get pollution control license",
    photoUrl: '/assets/service-images/pollution-control.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "8000",
    offerPrice: "6499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "7668",
    subCategoryId: pollutionSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.pollutionControlLicense);

  // Fire License
  await createService({
    name: "Fire License",
    description: "Get fire license",
    photoUrl: '/assets/service-images/fire-license.jpg',
    serviceType: "ONE_TIME",
    individualPrice: "6000",
    offerPrice: "4499",
    isGstApplicable: "true",
    gstPercentage: "18",
    finalIndividualPrice: "5308",
    subCategoryId: fireSub.subCategoryId,
    employeeId: "cmlepw8cr0003h71dg0yb2ybj",
    documentsRequired: "false"
  }, masterFields, servicePoints.fireLicense);

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