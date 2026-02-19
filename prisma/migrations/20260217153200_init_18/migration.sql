-- AlterTable
ALTER TABLE "ServiceDocument" ALTER COLUMN "uploadedBy" DROP NOT NULL,
ALTER COLUMN "requestedBy" DROP NOT NULL;
