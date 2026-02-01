/*
  Warnings:

  - You are about to drop the column `periodId` on the `ServiceDocument` table. All the data in the column will be lost.
  - The primary key for the `ServicePeriod` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `periodId` on the `ServicePeriod` table. All the data in the column will be lost.
  - The `status` column on the `ServicePeriod` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `servicePeriodId` to the `ServiceDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `ServicePeriod` table without a default value. This is not possible if the table is not empty.
  - The required column `servicePeriodId` was added to the `ServicePeriod` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `startDate` to the `ServicePeriod` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ServiceDocument" DROP CONSTRAINT "ServiceDocument_periodId_fkey";

-- AlterTable
ALTER TABLE "ServiceDocument" DROP COLUMN "periodId",
ADD COLUMN     "servicePeriodId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServicePeriod" DROP CONSTRAINT "ServicePeriod_pkey",
DROP COLUMN "periodId",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "servicePeriodId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
ADD CONSTRAINT "ServicePeriod_pkey" PRIMARY KEY ("servicePeriodId");

-- CreateTable
CREATE TABLE "PeriodStep" (
    "periodStepId" TEXT NOT NULL,
    "servicePeriodId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "remarks" TEXT,
    "updatedBy" TEXT,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodStep_pkey" PRIMARY KEY ("periodStepId")
);

-- AddForeignKey
ALTER TABLE "PeriodStep" ADD CONSTRAINT "PeriodStep_servicePeriodId_fkey" FOREIGN KEY ("servicePeriodId") REFERENCES "ServicePeriod"("servicePeriodId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceDocument" ADD CONSTRAINT "ServiceDocument_servicePeriodId_fkey" FOREIGN KEY ("servicePeriodId") REFERENCES "ServicePeriod"("servicePeriodId") ON DELETE RESTRICT ON UPDATE CASCADE;
