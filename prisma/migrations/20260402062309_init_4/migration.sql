-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "dueDay" JSONB,
ADD COLUMN     "reminderDays" JSONB;

-- CreateTable
CREATE TABLE "Reminder" (
    "reminderId" TEXT NOT NULL,
    "myServiceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceDescription" TEXT,
    "serviceType" TEXT,
    "frequency" "Frequency",
    "dueDate" TIMESTAMP(3) NOT NULL,
    "reminderDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("reminderId")
);

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_myServiceId_fkey" FOREIGN KEY ("myServiceId") REFERENCES "MyService"("myServiceId") ON DELETE RESTRICT ON UPDATE CASCADE;
