-- CreateEnum
CREATE TYPE "MyServiceStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PROCESSING', 'REASSIGNED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('EMAIL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'FOR_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentFlow" AS ENUM ('REQUESTED', 'ISSUED');

-- CreateEnum
CREATE TYPE "HistoryAction" AS ENUM ('APPLICATION_CREATED', 'APPLICATION_STEPS_CREATED', 'PERIODS_GENERATED', 'SERVICE_STARTED', 'DOCUMENTS_AUTO_REQUESTED', 'APPLICATION_REASSIGNED', 'APPLICATION_ASSIGNED', 'STEP_UPDATED', 'PERIOD_STEP_UPDATED', 'DOCUMENT_UPLOADED', 'DOCUMENT_REQUESTED', 'DOCUMENT_ISSUED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED');

-- CreateTable
CREATE TABLE "UtmCampaign" (
    "utmCampaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "content" TEXT,
    "term" TEXT,
    "refCode" TEXT,
    "fullUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UtmCampaign_pkey" PRIMARY KEY ("utmCampaignId")
);

-- CreateTable
CREATE TABLE "ShortLink" (
    "shortLinkId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("shortLinkId")
);

-- CreateTable
CREATE TABLE "ClickLog" (
    "clickLogId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "shortLinkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickLog_pkey" PRIMARY KEY ("clickLogId")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "formSubmissionId" TEXT NOT NULL,
    "formType" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "serviceRequired" TEXT,
    "comments" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("formSubmissionId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "redirectUrl" TEXT,
    "userId" TEXT,
    "employeeId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "Blog" (
    "blogId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "author" TEXT NOT NULL,
    "thumbnail" TEXT,
    "slug" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("blogId")
);

-- CreateTable
CREATE TABLE "EmailConfig" (
    "EmailConfig" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT,
    "accessKey" TEXT,
    "secretKey" TEXT,
    "region" TEXT,
    "fromEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("EmailConfig")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "PaymentSetting" (
    "paymentSettingId" TEXT NOT NULL,
    "isRazorpayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "razorpayKeyId" TEXT,
    "razorpaySecret" TEXT,
    "mode" TEXT,
    "webhookId" TEXT,
    "webhookSecret" TEXT,
    "alertEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSetting_pkey" PRIMARY KEY ("paymentSettingId")
);

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "password" TEXT,
    "photoUrl" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "refCode" TEXT,
    "utmCampaignId" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "provider" "Provider" NOT NULL DEFAULT 'EMAIL',
    "providerId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "refreshTokenId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "employeeId" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("refreshTokenId")
);

-- CreateTable
CREATE TABLE "Payment" (
    "paymentId" TEXT NOT NULL,
    "userId" TEXT,
    "createdById" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "refCode" TEXT,
    "utmCampaignId" TEXT,
    "serviceId" TEXT,
    "bundleId" TEXT,
    "type" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpayPaymentLink" TEXT,
    "errorDescription" TEXT,
    "errorCode" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("paymentId")
);

-- CreateTable
CREATE TABLE "Department" (
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentCode" TEXT NOT NULL,
    "labelColor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("departmentId")
);

-- CreateTable
CREATE TABLE "Employee" (
    "employeeId" TEXT NOT NULL,
    "employeeCode" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "profilePassword" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "inviteStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "designation" TEXT NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "photoUrl" TEXT,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "Category" (
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryId")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "subCategoryId" TEXT NOT NULL,
    "subCategoryName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("subCategoryId")
);

-- CreateTable
CREATE TABLE "Service" (
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" JSONB,
    "photoUrl" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "frequency" "Frequency",
    "duration" TEXT,
    "durationUnit" "DurationUnit",
    "documentsRequired" TEXT NOT NULL DEFAULT 'false',
    "requiredDocuments" JSONB,
    "individualPrice" TEXT NOT NULL,
    "offerPrice" TEXT,
    "isGstApplicable" TEXT NOT NULL DEFAULT 'true',
    "gstPercentage" TEXT,
    "finalIndividualPrice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("serviceId")
);

-- CreateTable
CREATE TABLE "MyService" (
    "myServiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "bundleId" TEXT,
    "status" "MyServiceStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MyService_pkey" PRIMARY KEY ("myServiceId")
);

-- CreateTable
CREATE TABLE "MasterInputField" (
    "masterFieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "placeholder" TEXT NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterInputField_pkey" PRIMARY KEY ("masterFieldId")
);

-- CreateTable
CREATE TABLE "ServiceInputField" (
    "fieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "placeholder" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "masterFieldId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceInputField_pkey" PRIMARY KEY ("fieldId")
);

-- CreateTable
CREATE TABLE "ServiceTrackStep" (
    "stepId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceTrackStep_pkey" PRIMARY KEY ("stepId")
);

-- CreateTable
CREATE TABLE "ServiceBundle" (
    "bundleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT NOT NULL,
    "bundlePrice" INTEGER NOT NULL,
    "bundleOfferPrice" INTEGER,
    "isGstApplicable" BOOLEAN NOT NULL DEFAULT true,
    "gstPercentage" INTEGER,
    "finalBundlePrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceBundle_pkey" PRIMARY KEY ("bundleId")
);

-- CreateTable
CREATE TABLE "ApplicationHistory" (
    "historyId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "applicationTrackStepId" TEXT,
    "servicePeriodId" TEXT,
    "periodStepId" TEXT,
    "documentId" TEXT,
    "action" "HistoryAction" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "doneByRole" TEXT NOT NULL,
    "doneById" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationHistory_pkey" PRIMARY KEY ("historyId")
);

-- CreateTable
CREATE TABLE "Application" (
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "bundleId" TEXT,
    "myServiceId" TEXT NOT NULL,
    "employeeId" TEXT,
    "serviceName" TEXT,
    "serviceDescription" TEXT,
    "servicePhoto" TEXT,
    "serviceType" TEXT,
    "frequency" "Frequency",
    "duration" TEXT,
    "durationUnit" "DurationUnit",
    "offerPrice" TEXT,
    "isGstApplicable" TEXT,
    "gstPercentage" TEXT,
    "finalPrice" TEXT,
    "formData" JSONB,
    "adminNote" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "ApplicationTrackStep" (
    "applicationTrackStepId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "remarks" TEXT,
    "updatedById" TEXT,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationTrackStep_pkey" PRIMARY KEY ("applicationTrackStepId")
);

-- CreateTable
CREATE TABLE "ServicePeriod" (
    "servicePeriodId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePeriod_pkey" PRIMARY KEY ("servicePeriodId")
);

-- CreateTable
CREATE TABLE "PeriodStep" (
    "periodStepId" TEXT NOT NULL,
    "servicePeriodId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "remarks" TEXT,
    "updatedById" TEXT,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodStep_pkey" PRIMARY KEY ("periodStepId")
);

-- CreateTable
CREATE TABLE "ServiceDocument" (
    "documentId" TEXT NOT NULL,
    "applicationTrackStepId" TEXT,
    "periodStepId" TEXT,
    "flow" "DocumentFlow" NOT NULL DEFAULT 'REQUESTED',
    "requestedBy" TEXT,
    "uploadedBy" TEXT,
    "documentType" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "fileUrl" TEXT,
    "textValue" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDocument_pkey" PRIMARY KEY ("documentId")
);

-- CreateTable
CREATE TABLE "_BundleServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BundleServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "UtmCampaign_campaign_key" ON "UtmCampaign"("campaign");

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_code_key" ON "ShortLink"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EmailEvent_name_key" ON "EmailEvent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "Payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_departmentId_key" ON "Department"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Application_myServiceId_key" ON "Application"("myServiceId");

-- CreateIndex
CREATE INDEX "_BundleServices_B_index" ON "_BundleServices"("B");

-- AddForeignKey
ALTER TABLE "ClickLog" ADD CONSTRAINT "ClickLog_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("shortLinkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_utmCampaignId_fkey" FOREIGN KEY ("utmCampaignId") REFERENCES "UtmCampaign"("utmCampaignId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_utmCampaignId_fkey" FOREIGN KEY ("utmCampaignId") REFERENCES "UtmCampaign"("utmCampaignId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("subCategoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyService" ADD CONSTRAINT "MyService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyService" ADD CONSTRAINT "MyService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("serviceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyService" ADD CONSTRAINT "MyService_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ServiceBundle"("bundleId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceInputField" ADD CONSTRAINT "ServiceInputField_masterFieldId_fkey" FOREIGN KEY ("masterFieldId") REFERENCES "MasterInputField"("masterFieldId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceInputField" ADD CONSTRAINT "ServiceInputField_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("serviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTrackStep" ADD CONSTRAINT "ServiceTrackStep_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("serviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationHistory" ADD CONSTRAINT "ApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("serviceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ServiceBundle"("bundleId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_myServiceId_fkey" FOREIGN KEY ("myServiceId") REFERENCES "MyService"("myServiceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTrackStep" ADD CONSTRAINT "ApplicationTrackStep_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTrackStep" ADD CONSTRAINT "ApplicationTrackStep_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePeriod" ADD CONSTRAINT "ServicePeriod_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodStep" ADD CONSTRAINT "PeriodStep_servicePeriodId_fkey" FOREIGN KEY ("servicePeriodId") REFERENCES "ServicePeriod"("servicePeriodId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodStep" ADD CONSTRAINT "PeriodStep_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocument" ADD CONSTRAINT "ServiceDocument_applicationTrackStepId_fkey" FOREIGN KEY ("applicationTrackStepId") REFERENCES "ApplicationTrackStep"("applicationTrackStepId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocument" ADD CONSTRAINT "ServiceDocument_periodStepId_fkey" FOREIGN KEY ("periodStepId") REFERENCES "PeriodStep"("periodStepId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BundleServices" ADD CONSTRAINT "_BundleServices_A_fkey" FOREIGN KEY ("A") REFERENCES "Service"("serviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BundleServices" ADD CONSTRAINT "_BundleServices_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceBundle"("bundleId") ON DELETE CASCADE ON UPDATE CASCADE;
