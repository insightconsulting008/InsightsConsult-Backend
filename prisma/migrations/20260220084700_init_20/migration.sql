-- CreateEnum
CREATE TYPE "DocumentFlow" AS ENUM ('REQUESTED', 'ISSUED');

-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'FOR_REVIEW';

-- AlterTable
ALTER TABLE "ServiceDocument" ADD COLUMN     "flow" "DocumentFlow" NOT NULL DEFAULT 'REQUESTED';
