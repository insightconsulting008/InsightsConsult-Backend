-- AlterTable
ALTER TABLE "EmailConfig" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#e11d48',
ADD COLUMN     "secondaryColor" TEXT NOT NULL DEFAULT '#f1f5f9',
ADD COLUMN     "textColor" TEXT NOT NULL DEFAULT '#111111',
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "templateId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("templateId")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "emailLogId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("emailLogId")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_eventId_key" ON "EmailTemplate"("eventId");

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "EmailEvent"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;
