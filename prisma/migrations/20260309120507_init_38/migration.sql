/*
  Warnings:

  - You are about to drop the column `paymentLink` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paymentLink",
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorDescription" TEXT,
ADD COLUMN     "razorpayPaymentLinkId" TEXT;
