CREATE TYPE "CheckoutDropOffStatus" AS ENUM ('OPEN', 'DRAFT_READY', 'STOPPED');

CREATE TABLE "CheckoutDropOff" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "CheckoutDropOffStatus" NOT NULL,
    "draftSubject" TEXT,
    "draftBody" TEXT,
    "policyDecision" "PolicyDecision",
    "policyReason" TEXT,
    "checkoutCreatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "dataSource" "DataSource" NOT NULL,
    CONSTRAINT "CheckoutDropOff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CheckoutDropOffAudit" (
    "id" TEXT NOT NULL,
    "dropOffId" TEXT NOT NULL,
    "actor" "Actor" NOT NULL,
    "eventType" TEXT NOT NULL,
    "decision" TEXT,
    "reasoning" TEXT,
    "output" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "dataSource" "DataSource" NOT NULL,
    CONSTRAINT "CheckoutDropOffAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckoutDropOff_publicId_key" ON "CheckoutDropOff"("publicId");
CREATE UNIQUE INDEX "CheckoutDropOff_razorpayOrderId_key" ON "CheckoutDropOff"("razorpayOrderId");
CREATE INDEX "CheckoutDropOff_merchantId_status_idx" ON "CheckoutDropOff"("merchantId", "status");
CREATE INDEX "CheckoutDropOff_merchantId_lastUpdatedAt_idx" ON "CheckoutDropOff"("merchantId", "lastUpdatedAt");
CREATE INDEX "CheckoutDropOffAudit_dropOffId_occurredAt_idx" ON "CheckoutDropOffAudit"("dropOffId", "occurredAt");

ALTER TABLE "CheckoutDropOff" ADD CONSTRAINT "CheckoutDropOff_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CheckoutDropOff" ADD CONSTRAINT "CheckoutDropOff_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CheckoutDropOffAudit" ADD CONSTRAINT "CheckoutDropOffAudit_dropOffId_fkey" FOREIGN KEY ("dropOffId") REFERENCES "CheckoutDropOff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
