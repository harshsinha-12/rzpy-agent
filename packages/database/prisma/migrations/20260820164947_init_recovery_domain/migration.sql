-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('SIMULATED', 'RAZORPAY_TEST_MODE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'CARD', 'NETBANKING', 'WALLET', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'FAILED', 'AUTHORIZED', 'CAPTURED');

-- CreateEnum
CREATE TYPE "RecoveryCaseStatus" AS ENUM ('OPEN', 'DIAGNOSING', 'WAITING', 'ACTION_REQUIRED', 'RECOVERY_RUNNING', 'RECOVERED', 'ESCALATED', 'STOPPED', 'EXHAUSTED');

-- CreateEnum
CREATE TYPE "FailureCategory" AS ENUM ('CUSTOMER_AUTH', 'INSUFFICIENT_FUNDS', 'GATEWAY_TRANSIENT', 'ISSUER_FAILURE', 'MERCHANT_ERROR', 'NETWORK_ERROR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RecoverabilityBand" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'NONE');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('WAIT', 'CREATE_PAYMENT_LINK', 'SEND_REMINDER', 'ALTERNATIVE_METHOD', 'ESCALATE', 'STOP');

-- CreateEnum
CREATE TYPE "PolicyDecision" AS ENUM ('APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "ActionResult" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'SKIPPED', 'RETRYING');

-- CreateEnum
CREATE TYPE "Actor" AS ENUM ('WEBHOOK', 'DIAGNOSIS_ENGINE', 'RECOVERY_AGENT', 'POLICY_ENGINE', 'EXECUTION_LAYER', 'SYSTEM');

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataSource" "DataSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "externalRef" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "dataSource" "DataSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryPolicy" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "maxAttemptsPerCase" INTEGER NOT NULL,
    "maxMessagesPerDay" INTEGER NOT NULL,
    "minimumRetryDelayMinutes" INTEGER NOT NULL,
    "recoveryWindowHours" INTEGER NOT NULL,
    "allowedActions" "ActionType"[],
    "dataSource" "DataSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "errorCode" TEXT,
    "errorSource" TEXT,
    "errorStep" TEXT,
    "errorReason" TEXT,
    "errorDescription" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "dataSource" "DataSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCase" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentEventId" TEXT NOT NULL,
    "amountAtRiskPaise" INTEGER NOT NULL,
    "recoveredAmountPaise" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL,
    "status" "RecoveryCaseStatus" NOT NULL,
    "failureCategory" "FailureCategory" NOT NULL,
    "recoverabilityBand" "RecoverabilityBand" NOT NULL,
    "recoverabilityScore" INTEGER NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "dataSource" "DataSource" NOT NULL,

    CONSTRAINT "RecoveryCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryAction" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "proposedBy" "Actor" NOT NULL,
    "reason" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "policyDecision" "PolicyDecision" NOT NULL,
    "policyReason" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "result" "ActionResult" NOT NULL,
    "razorpayReference" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "dataSource" "DataSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecoveryAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actionId" TEXT,
    "actor" "Actor" NOT NULL,
    "eventType" TEXT NOT NULL,
    "input" JSONB,
    "decision" TEXT,
    "reasoning" TEXT,
    "output" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "dataSource" "DataSource" NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationRun" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "seed" INTEGER NOT NULL,
    "configuration" JSONB NOT NULL,
    "paymentCount" INTEGER NOT NULL,
    "revenueAtRiskPaise" INTEGER NOT NULL,
    "recoveredRevenuePaise" INTEGER NOT NULL,
    "baselineRevenuePaise" INTEGER NOT NULL,
    "incrementalRevenuePaise" INTEGER NOT NULL,
    "recoveryRateBps" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL,
    "falseInterventions" INTEGER NOT NULL,
    "policyStops" INTEGER NOT NULL,
    "customerContacts" INTEGER NOT NULL,
    "dataSource" "DataSource" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_merchantId_externalRef_key" ON "Customer"("merchantId", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryPolicy_merchantId_key" ON "RecoveryPolicy"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_razorpayPaymentId_key" ON "PaymentEvent"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "PaymentEvent_merchantId_occurredAt_idx" ON "PaymentEvent"("merchantId", "occurredAt");

-- CreateIndex
CREATE INDEX "PaymentEvent_razorpayOrderId_idx" ON "PaymentEvent"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryCase_publicId_key" ON "RecoveryCase"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryCase_paymentEventId_key" ON "RecoveryCase"("paymentEventId");

-- CreateIndex
CREATE INDEX "RecoveryCase_merchantId_status_idx" ON "RecoveryCase"("merchantId", "status");

-- CreateIndex
CREATE INDEX "RecoveryCase_merchantId_lastUpdatedAt_idx" ON "RecoveryCase"("merchantId", "lastUpdatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAction_idempotencyKey_key" ON "RecoveryAction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RecoveryAction_caseId_createdAt_idx" ON "RecoveryAction"("caseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryAction_caseId_actionType_attemptNumber_key" ON "RecoveryAction"("caseId", "actionType", "attemptNumber");

-- CreateIndex
CREATE INDEX "AuditEvent_caseId_occurredAt_idx" ON "AuditEvent"("caseId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationRun_merchantId_seed_key" ON "SimulationRun"("merchantId", "seed");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryPolicy" ADD CONSTRAINT "RecoveryPolicy_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCase" ADD CONSTRAINT "RecoveryCase_paymentEventId_fkey" FOREIGN KEY ("paymentEventId") REFERENCES "PaymentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryAction" ADD CONSTRAINT "RecoveryAction_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "RecoveryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "RecoveryCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "RecoveryAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
