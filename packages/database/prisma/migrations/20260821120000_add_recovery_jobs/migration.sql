-- CreateEnum
CREATE TYPE "RecoveryJobStatus" AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED', 'EXHAUSTED');

-- CreateTable
CREATE TABLE "RecoveryJob" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "bullJobId" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "RecoveryJobStatus" NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL,
    "lastError" TEXT,
    "caseId" TEXT,
    "actionId" TEXT,
    "dataSource" "DataSource" NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RecoveryJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryJob_queueName_bullJobId_key" ON "RecoveryJob"("queueName", "bullJobId");

-- CreateIndex
CREATE INDEX "RecoveryJob_status_updatedAt_idx" ON "RecoveryJob"("status", "updatedAt");
