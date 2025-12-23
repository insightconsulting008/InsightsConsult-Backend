/*
  Warnings:

  - Made the column `photoUrl` on table `Service` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "documentsRequired" SET DEFAULT 'true',
ALTER COLUMN "documentsRequired" SET DATA TYPE TEXT,
ALTER COLUMN "isGstApplicable" SET DEFAULT 'true',
ALTER COLUMN "isGstApplicable" SET DATA TYPE TEXT,
ALTER COLUMN "photoUrl" SET NOT NULL;
