-- CreateTable
CREATE TABLE "ServicePeriod" (
    "periodId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePeriod_pkey" PRIMARY KEY ("periodId")
);

-- CreateTable
CREATE TABLE "ServiceDocument" (
    "documentId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceDocument_pkey" PRIMARY KEY ("documentId")
);

-- AddForeignKey
ALTER TABLE "ServicePeriod" ADD CONSTRAINT "ServicePeriod_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocument" ADD CONSTRAINT "ServiceDocument_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ServicePeriod"("periodId") ON DELETE RESTRICT ON UPDATE CASCADE;
