-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "bundleId" TEXT;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ServiceBundle"("bundleId") ON DELETE SET NULL ON UPDATE CASCADE;
