-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "duration" TEXT,
ADD COLUMN     "durationUnit" "DurationUnit",
ADD COLUMN     "finalPrice" TEXT,
ADD COLUMN     "frequency" "Frequency",
ADD COLUMN     "gstPercentage" TEXT,
ADD COLUMN     "isGstApplicable" TEXT,
ADD COLUMN     "offerPrice" TEXT,
ADD COLUMN     "serviceDescription" TEXT,
ADD COLUMN     "serviceName" TEXT,
ADD COLUMN     "servicePhoto" TEXT,
ADD COLUMN     "serviceType" TEXT;
