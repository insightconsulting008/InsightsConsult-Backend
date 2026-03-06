-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('EMAIL', 'GOOGLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "provider" "Provider" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "providerId" TEXT,
ALTER COLUMN "phoneNumber" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;
