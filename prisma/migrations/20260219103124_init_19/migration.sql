/*
  Warnings:

  - Added the required column `inputType` to the `ServiceDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ServiceDocument" ADD COLUMN     "inputType" TEXT NOT NULL;
