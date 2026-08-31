ALTER TABLE "CheckoutDropOff"
  ADD COLUMN "paymentLinkId" TEXT,
  ADD COLUMN "paymentLinkUrl" TEXT;

CREATE UNIQUE INDEX "CheckoutDropOff_paymentLinkId_key"
  ON "CheckoutDropOff"("paymentLinkId");
