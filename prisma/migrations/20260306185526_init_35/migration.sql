/*
  Warnings:

  - Made the column `photoUrl` on table `ServiceBundle` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ServiceBundle" ALTER COLUMN "photoUrl" SET NOT NULL;
