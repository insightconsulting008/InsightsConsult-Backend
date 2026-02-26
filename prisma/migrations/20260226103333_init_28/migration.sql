-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;
