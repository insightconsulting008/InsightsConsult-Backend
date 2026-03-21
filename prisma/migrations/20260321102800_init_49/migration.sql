-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "inviteStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "isFirstLogin" BOOLEAN NOT NULL DEFAULT true;
