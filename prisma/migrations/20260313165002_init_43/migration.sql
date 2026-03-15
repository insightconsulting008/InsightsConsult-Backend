-- CreateTable
CREATE TABLE "EmailConfig" (
    "EmailConfig" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT,
    "accessKey" TEXT,
    "secretKey" TEXT,
    "region" TEXT,
    "fromEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("EmailConfig")
);
