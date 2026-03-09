-- AlterTable
ALTER TABLE "PaymentSetting" ADD COLUMN     "alertEmail" TEXT,
ADD COLUMN     "webhookId" TEXT,
ADD COLUMN     "webhookSecret" TEXT;
