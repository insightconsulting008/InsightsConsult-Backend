/*
  Warnings:

  - You are about to drop the `EmailTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailTemplate" DROP CONSTRAINT "EmailTemplate_eventId_fkey";

-- DropTable
DROP TABLE "EmailTemplate";
