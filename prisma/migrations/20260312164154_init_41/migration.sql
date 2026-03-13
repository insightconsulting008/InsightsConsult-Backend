/*
  Warnings:

  - You are about to drop the column `razorpayPaymentLinkId` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "razorpayPaymentLinkId",
ADD COLUMN     "razorpayPaymentLink" TEXT;
