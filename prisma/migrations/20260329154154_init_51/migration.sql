-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refCode" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- CreateTable
CREATE TABLE "UtmCampaign" (
    "utmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "content" TEXT,
    "term" TEXT,
    "refCode" TEXT,
    "fullUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UtmCampaign_pkey" PRIMARY KEY ("utmId")
);

-- CreateTable
CREATE TABLE "ShortLink" (
    "shortLinkId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fullUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("shortLinkId")
);

-- CreateTable
CREATE TABLE "ClickLog" (
    "ClickLogId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "shortLinkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickLog_pkey" PRIMARY KEY ("ClickLogId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_code_key" ON "ShortLink"("code");

-- AddForeignKey
ALTER TABLE "ClickLog" ADD CONSTRAINT "ClickLog_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("shortLinkId") ON DELETE RESTRICT ON UPDATE CASCADE;
