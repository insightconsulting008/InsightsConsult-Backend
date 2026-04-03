-- CreateTable
CREATE TABLE "ServiceRequest" (
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "bundleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("requestId")
);

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("serviceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "ServiceBundle"("bundleId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;
