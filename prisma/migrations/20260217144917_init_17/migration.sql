/*
  Warnings:

  - Added the required column `requestedBy` to the `ServiceDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ServiceDocument` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "ServiceDocument" DROP CONSTRAINT "ServiceDocument_servicePeriodId_fkey";

-- AlterTable
ALTER TABLE "ServiceDocument" ADD COLUMN     "applicationTrackStepId" TEXT,
ADD COLUMN     "requestedBy" TEXT NOT NULL,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "textValue" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "fileUrl" DROP NOT NULL,
ALTER COLUMN "version" SET DEFAULT 0,
ALTER COLUMN "servicePeriodId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ServiceDocument" ADD CONSTRAINT "ServiceDocument_applicationTrackStepId_fkey" FOREIGN KEY ("applicationTrackStepId") REFERENCES "ApplicationTrackStep"("applicationTrackStepId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocument" ADD CONSTRAINT "ServiceDocument_servicePeriodId_fkey" FOREIGN KEY ("servicePeriodId") REFERENCES "ServicePeriod"("servicePeriodId") ON DELETE SET NULL ON UPDATE CASCADE;
