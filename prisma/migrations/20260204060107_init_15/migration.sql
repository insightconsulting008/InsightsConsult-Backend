/*
  Warnings:

  - You are about to drop the column `updatedBy` on the `ApplicationTrackStep` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ApplicationTrackStep" DROP COLUMN "updatedBy",
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "ServicePeriod" ADD COLUMN     "completionPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
