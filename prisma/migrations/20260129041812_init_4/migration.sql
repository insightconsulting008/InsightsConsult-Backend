/*
  Warnings:

  - The primary key for the `ApplicationTrackStep` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `completed` on the `ApplicationTrackStep` table. All the data in the column will be lost.
  - You are about to drop the column `trackId` on the `ApplicationTrackStep` table. All the data in the column will be lost.
  - The required column `applicationTrackStepId` was added to the `ApplicationTrackStep` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "ApplicationTrackStep" DROP CONSTRAINT "ApplicationTrackStep_pkey",
DROP COLUMN "completed",
DROP COLUMN "trackId",
ADD COLUMN     "applicationTrackStepId" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD CONSTRAINT "ApplicationTrackStep_pkey" PRIMARY KEY ("applicationTrackStepId");
