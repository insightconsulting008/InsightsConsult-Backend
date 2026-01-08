-- AlterTable
ALTER TABLE "MyService" ADD COLUMN     "bundleId" TEXT;

-- AddForeignKey
ALTER TABLE "MyService" ADD CONSTRAINT "MyService_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ServiceBundle"("bundleId") ON DELETE SET NULL ON UPDATE CASCADE;
