-- DropIndex
DROP INDEX "User_phoneNumber_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshToken" TEXT;
