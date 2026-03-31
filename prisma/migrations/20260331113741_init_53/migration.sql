/*
  Warnings:

  - The primary key for the `ClickLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ClickLogId` on the `ClickLog` table. All the data in the column will be lost.
  - The required column `clickLogId` was added to the `ClickLog` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "ClickLog" DROP CONSTRAINT "ClickLog_pkey",
DROP COLUMN "ClickLogId",
ADD COLUMN     "clickLogId" TEXT NOT NULL,
ADD CONSTRAINT "ClickLog_pkey" PRIMARY KEY ("clickLogId");
