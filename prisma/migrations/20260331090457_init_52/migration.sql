/*
  Warnings:

  - You are about to drop the column `utmCampaign` on the `User` table. All the data in the column will be lost.
  - The primary key for the `UtmCampaign` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `utmId` on the `UtmCampaign` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[campaign]` on the table `UtmCampaign` will be added. If there are existing duplicate values, this will fail.
  - The required column `utmCampaignId` was added to the `UtmCampaign` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refCode" TEXT,
ADD COLUMN     "utmCampaignId" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "utmCampaign",
ADD COLUMN     "utmCampaignId" TEXT;

-- AlterTable
ALTER TABLE "UtmCampaign" DROP CONSTRAINT "UtmCampaign_pkey",
DROP COLUMN "utmId",
ADD COLUMN     "utmCampaignId" TEXT NOT NULL,
ADD CONSTRAINT "UtmCampaign_pkey" PRIMARY KEY ("utmCampaignId");

-- CreateIndex
CREATE UNIQUE INDEX "UtmCampaign_campaign_key" ON "UtmCampaign"("campaign");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_utmCampaignId_fkey" FOREIGN KEY ("utmCampaignId") REFERENCES "UtmCampaign"("utmCampaignId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_utmCampaignId_fkey" FOREIGN KEY ("utmCampaignId") REFERENCES "UtmCampaign"("utmCampaignId") ON DELETE SET NULL ON UPDATE CASCADE;
