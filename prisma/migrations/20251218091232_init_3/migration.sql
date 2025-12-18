/*
  Warnings:

  - The `offerPrice` column on the `Service` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `bundleOfferPrice` column on the `ServiceBundle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `finalIndividualPrice` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceType` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `individualPrice` on the `Service` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `finalBundlePrice` to the `ServiceBundle` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `bundlePrice` on the `ServiceBundle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "documentsRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "durationUnit" TEXT,
ADD COLUMN     "finalIndividualPrice" INTEGER NOT NULL,
ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "gstPercentage" INTEGER,
ADD COLUMN     "isGstApplicable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "serviceType" TEXT NOT NULL,
DROP COLUMN "individualPrice",
ADD COLUMN     "individualPrice" INTEGER NOT NULL,
DROP COLUMN "offerPrice",
ADD COLUMN     "offerPrice" INTEGER;

-- AlterTable
ALTER TABLE "ServiceBundle" ADD COLUMN     "finalBundlePrice" INTEGER NOT NULL,
ADD COLUMN     "gstPercentage" INTEGER,
ADD COLUMN     "isGstApplicable" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "bundlePrice",
ADD COLUMN     "bundlePrice" INTEGER NOT NULL,
DROP COLUMN "bundleOfferPrice",
ADD COLUMN     "bundleOfferPrice" INTEGER;
