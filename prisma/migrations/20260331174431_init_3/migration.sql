/*
  Warnings:

  - You are about to drop the column `campaign` on the `UtmCampaign` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `UtmCampaign` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[campaignName]` on the table `UtmCampaign` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `campaignName` to the `UtmCampaign` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UtmCampaign_campaign_key";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "utmCampaignName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "utmCampaignName" TEXT;

-- AlterTable
ALTER TABLE "UtmCampaign" DROP COLUMN "campaign",
DROP COLUMN "name",
ADD COLUMN     "campaignName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UtmCampaign_campaignName_key" ON "UtmCampaign"("campaignName");
