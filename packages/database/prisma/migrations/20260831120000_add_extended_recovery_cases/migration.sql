CREATE TYPE "ExtendedRecoveryKind" AS ENUM ('SUBSCRIPTION', 'RECEIVABLE', 'MANDATE', 'VOICE', 'UDHAAR');
CREATE TYPE "ExtendedRecoveryStatus" AS ENUM ('OPEN', 'DRAFT_READY', 'HUMAN_REVIEW', 'SNOOZED', 'STOPPED', 'RECOVERED');

CREATE TABLE "ExtendedRecoveryCase" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "kind" "ExtendedRecoveryKind" NOT NULL,
  "reference" TEXT NOT NULL,
  "amountPaise" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "ExtendedRecoveryStatus" NOT NULL,
  "dueAt" TIMESTAMP(3),
  "reason" TEXT NOT NULL,
  "draftSubject" TEXT,
  "draftBody" TEXT,
  "voiceScript" TEXT,
  "operatorAction" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "dataSource" "DataSource" NOT NULL,
  CONSTRAINT "ExtendedRecoveryCase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExtendedRecoveryCase_publicId_key" ON "ExtendedRecoveryCase"("publicId");
CREATE UNIQUE INDEX "ExtendedRecoveryCase_reference_key" ON "ExtendedRecoveryCase"("reference");
CREATE INDEX "ExtendedRecoveryCase_merchantId_kind_status_idx" ON "ExtendedRecoveryCase"("merchantId", "kind", "status");
ALTER TABLE "ExtendedRecoveryCase" ADD CONSTRAINT "ExtendedRecoveryCase_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExtendedRecoveryCase" ADD CONSTRAINT "ExtendedRecoveryCase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
