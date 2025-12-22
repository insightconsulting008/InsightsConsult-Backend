/*
  Warnings:

  - The `durationUnit` column on the `Service` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `frequency` column on the `Service` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "durationUnit",
ADD COLUMN     "durationUnit" "DurationUnit",
DROP COLUMN "frequency",
ADD COLUMN     "frequency" "Frequency";
