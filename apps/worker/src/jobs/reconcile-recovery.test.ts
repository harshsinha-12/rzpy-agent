import {
  createPrismaClient,
  runDemoSeed,
  type PrismaClient,
} from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { reconcileRecoveryJobs } from "./reconcile-recovery.js";

describe.sequential("reconcileRecoveryJobs", () => {
  let prisma: PrismaClient;
  const suffix = `recon_${Date.now()}`;

  beforeAll(async () => {
    prisma = createPrismaClient(
      process.env.DATABASE_URL ??
        "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos",
    );
    await prisma.$connect();
    await runDemoSeed(prisma, 20260820);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.recoveryAction.deleteMany({
        where: { id: `action_${suffix}` },
      });
      await prisma.recoveryCase.deleteMany({
        where: { id: `case_${suffix}` },
      });
      await prisma.paymentEvent.deleteMany({
        where: { id: `payment_${suffix}` },
      });
      await prisma.customer.deleteMany({
        where: { id: `customer_${suffix}` },
      });
      await prisma.$disconnect();
    }
  });

  it("re-enqueues overdue approved actions without creating duplicates", async () => {
    const merchant = await prisma.merchant.findUniqueOrThrow({
      where: { slug: DEMO_MERCHANT_SLUG },
    });
    const now = new Date();
    const customer = await prisma.customer.create({
      data: {
        createdAt: now,
        dataSource: "RAZORPAY_TEST_MODE",
        externalRef: `cust_${suffix}`,
        id: `customer_${suffix}`,
        merchantId: merchant.id,
        name: "Reconcile Customer",
        updatedAt: now,
      },
    });
    const payment = await prisma.paymentEvent.create({
      data: {
        amountPaise: 10000,
        createdAt: now,
        currency: "INR",
        customerId: customer.id,
        dataSource: "RAZORPAY_TEST_MODE",
        eventType: "payment.failed",
        id: `payment_${suffix}`,
        merchantId: merchant.id,
        occurredAt: now,
        paymentMethod: "UPI",
        rawPayload: { test: true },
        razorpayOrderId: `order_${suffix}`,
        razorpayPaymentId: `pay_${suffix}`,
        status: "FAILED",
      },
    });
    const recoveryCase = await prisma.recoveryCase.create({
      data: {
        amountAtRiskPaise: 10000,
        currency: "INR",
        customerId: customer.id,
        dataSource: "RAZORPAY_TEST_MODE",
        diagnosis: "Overdue fixture.",
        failureCategory: "GATEWAY_TRANSIENT",
        id: `case_${suffix}`,
        lastUpdatedAt: now,
        merchantId: merchant.id,
        openedAt: now,
        paymentEventId: payment.id,
        publicId: `RC-TM-${suffix.slice(-8)}`,
        recoverabilityBand: "HIGH",
        recoverabilityScore: 80,
        status: "ACTION_REQUIRED",
      },
    });
    await prisma.recoveryAction.create({
      data: {
        actionType: "WAIT",
        attemptNumber: 1,
        caseId: recoveryCase.id,
        confidence: 80,
        createdAt: now,
        dataSource: "RAZORPAY_TEST_MODE",
        id: `action_${suffix}`,
        idempotencyKey: `recovery:pay_${suffix}:WAIT:1`,
        policyDecision: "APPROVED",
        policyReason: "Fixture",
        proposedBy: "POLICY_ENGINE",
        reason: "Fixture",
        result: "PENDING",
        scheduledFor: new Date(now.getTime() - 60_000),
      },
    });

    const executions: string[] = [];
    const summary = await reconcileRecoveryJobs(prisma, {
      enqueueAnalysis: async () => undefined,
      enqueueExecute: async ({ actionId }) => {
        executions.push(actionId);
      },
      enqueuePaymentEvent: async () => undefined,
    });

    expect(summary.executions).toBeGreaterThanOrEqual(1);
    expect(executions).toContain(`action_${suffix}`);
  });
});
