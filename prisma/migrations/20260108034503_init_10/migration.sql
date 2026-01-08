/*
  Warnings:

  - A unique constraint covering the columns `[myServiceId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `myServiceId` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MyServiceStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "myServiceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "MyService" (
    "myServiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "status" "MyServiceStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MyService_pkey" PRIMARY KEY ("myServiceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_myServiceId_key" ON "Application"("myServiceId");

-- AddForeignKey
ALTER TABLE "MyService" ADD CONSTRAINT "MyService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("serviceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_myServiceId_fkey" FOREIGN KEY ("myServiceId") REFERENCES "MyService"("myServiceId") ON DELETE RESTRICT ON UPDATE CASCADE;
