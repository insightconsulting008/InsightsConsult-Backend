/*
  Warnings:

  - You are about to drop the column `updatedBy` on the `PeriodStep` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PeriodStep" DROP COLUMN "updatedBy",
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "requiredDocuments" JSONB;

-- AddForeignKey
ALTER TABLE "MyService" ADD CONSTRAINT "MyService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTrackStep" ADD CONSTRAINT "ApplicationTrackStep_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodStep" ADD CONSTRAINT "PeriodStep_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;
