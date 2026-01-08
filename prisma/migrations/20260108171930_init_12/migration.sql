-- CreateTable
CREATE TABLE "PaymentSetting" (
    "paymentSettingId" TEXT NOT NULL,
    "isRazorpayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "razorpayKeyId" TEXT,
    "razorpaySecret" TEXT,
    "webhookSecret" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSetting_pkey" PRIMARY KEY ("paymentSettingId")
);
