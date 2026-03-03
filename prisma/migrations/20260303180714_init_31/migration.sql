-- CreateEnum
CREATE TYPE "HistoryAction" AS ENUM ('APPLICATION_CREATED', 'STATUS_CHANGED', 'ASSIGNED_TO_EMPLOYEE', 'STEP_STATUS_CHANGED', 'PERIOD_LOCKED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED');

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

-- AddForeignKey
ALTER TABLE "ApplicationHistory" ADD CONSTRAINT "ApplicationHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("applicationId") ON DELETE RESTRICT ON UPDATE CASCADE;
