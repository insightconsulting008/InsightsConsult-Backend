/*
  Warnings:

  - You are about to drop the column `servicePeriodId` on the `ServiceDocument` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceDocument" DROP CONSTRAINT "ServiceDocument_servicePeriodId_fkey";

-- AlterTable
ALTER TABLE "ServiceDocument" DROP COLUMN "servicePeriodId",
ADD COLUMN     "periodStepId" TEXT;

-- AddForeignKey
ALTER TABLE "ServiceDocument" ADD CONSTRAINT "ServiceDocument_periodStepId_fkey" FOREIGN KEY ("periodStepId") REFERENCES "PeriodStep"("periodStepId") ON DELETE SET NULL ON UPDATE CASCADE;
