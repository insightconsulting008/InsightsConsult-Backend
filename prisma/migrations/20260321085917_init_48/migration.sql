-- DropForeignKey
ALTER TABLE "ServiceInputField" DROP CONSTRAINT "ServiceInputField_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceTrackStep" DROP CONSTRAINT "ServiceTrackStep_serviceId_fkey";

-- AddForeignKey
ALTER TABLE "ServiceInputField" ADD CONSTRAINT "ServiceInputField_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("serviceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTrackStep" ADD CONSTRAINT "ServiceTrackStep_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("serviceId") ON DELETE CASCADE ON UPDATE CASCADE;
