/*
  Warnings:

  - You are about to drop the column `webhookSecret` on the `PaymentSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentSetting" DROP COLUMN "webhookSecret";
