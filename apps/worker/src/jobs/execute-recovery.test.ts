import {
  createPrismaClient,
  runDemoSeed,
  type PrismaClient,
} from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import { TransientRecoveryError } from "@recoveryos/recovery-engine";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { RecoveryExecutionTools } from "../tools/recovery-tools.js";
import { createRecoveryActionExecutor } from "../tools/recovery-action-executor.js";

import {
  executeRecoveryAction,
  exhaustRecoveryAction,
} from "./execute-recovery.js";
import { verifyRecoveryAction } from "./verify-recovery.js";

describe.sequential("executeRecoveryAction", () => {
  let prisma: PrismaClient;
  const suffix = `step8_${Date.now()}`;

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
      await prisma.recoveryCase.deleteMany({
        where: { id: { startsWith: `case_${suffix}` } },
      });
      await prisma.paymentEvent.deleteMany({
        where: { id: { startsWith: `payment_${suffix}` } },
      });
      await prisma.customer.deleteMany({
        where: { id: { startsWith: `customer_${suffix}` } },
      });
      await prisma.$disconnect();
    }
  });

  it("retries a transient tool failure without creating a second action", async () => {
    const actionId = await createApprovedAction(prisma, suffix, "WAIT");
    const first = await executeRecoveryAction(prisma, actionId);
    const second = await executeRecoveryAction(prisma, actionId);
    const actions = await prisma.recoveryAction.findMany({
      where: { id: actionId },
    });

    expect(first).toEqual({ result: "SUCCEEDED", skipped: false });
    expect(second).toEqual({ result: "SUCCEEDED", skipped: true });
    expect(actions).toHaveLength(1);
    expect(actions[0]?.result).toBe("SUCCEEDED");
  });

  it("retries a tool failure then succeeds with one action row", async () => {
    const actionId = await createApprovedAction(
      prisma,
      `${suffix}_tool`,
      "CREATE_PAYMENT_LINK",
    );
    let attempts = 0;
    const toolExecutor = {
      async execute() {
        attempts += 1;
        if (attempts === 1) {
          throw new TransientRecoveryError("Razorpay 5xx");
        }
        return {
          razorpayReference: "plink_test",
          result: "SUCCEEDED" as const,
        };
      },
    };

    await expect(
      executeRecoveryAction(prisma, actionId, { toolExecutor }),
    ).rejects.toBeInstanceOf(TransientRecoveryError);
    const recovered = await executeRecoveryAction(prisma, actionId, {
      toolExecutor,
    });
    const action = await prisma.recoveryAction.findUniqueOrThrow({
      where: { id: actionId },
    });

    expect(attempts).toBe(2);
    expect(recovered).toEqual({ result: "SUCCEEDED", skipped: false });
    expect(action.razorpayReference).toBe("plink_test");
    expect(
      await prisma.recoveryAction.count({
        where: { caseId: action.caseId },
      }),
    ).toBe(1);
    expect(
      await prisma.auditEvent.findMany({
        orderBy: { occurredAt: "asc" },
        where: { actionId },
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor: "EXECUTION_LAYER",
          decision: "RETRYING",
          eventType: "recovery.execution.failed",
          reasoning: "Razorpay 5xx",
        }),
        expect.objectContaining({
          actor: "EXECUTION_LAYER",
          decision: "SUCCEEDED",
          eventType: "recovery.executed",
        }),
      ]),
    );
  });

  it("marks the case exhausted after the retry budget is spent", async () => {
    const actionId = await createApprovedAction(
      prisma,
      `${suffix}_exhaust`,
      "CREATE_PAYMENT_LINK",
    );
    await exhaustRecoveryAction(prisma, actionId, "Razorpay kept failing.");
    const action = await prisma.recoveryAction.findUniqueOrThrow({
      include: { recoveryCase: { include: { auditEvents: true } } },
      where: { id: actionId },
    });

    expect(action.result).toBe("FAILED");
    expect(action.recoveryCase.status).toBe("EXHAUSTED");
    expect(action.recoveryCase.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor: "SYSTEM",
          decision: "EXHAUSTED",
          eventType: "job.exhausted",
        }),
      ]),
    );
  });

  it("re-checks payment state and skips every tool for a captured payment", async () => {
    const actionId = await createApprovedAction(
      prisma,
      `${suffix}_captured`,
      "CREATE_PAYMENT_LINK",
    );
    const execute = vi.fn();
    const recoveryTools: RecoveryExecutionTools = {
      execute,
      recheckPayment: vi.fn().mockResolvedValue({
        amountPaise: 499900,
        status: "CAPTURED",
      }),
      verifyPaymentLink: vi.fn(),
    };
    const toolExecutor = createRecoveryActionExecutor(prisma, recoveryTools);

    await expect(
      executeRecoveryAction(prisma, actionId, { toolExecutor }),
    ).resolves.toEqual({ result: "SKIPPED", skipped: false });
    expect(execute).not.toHaveBeenCalled();
    const action = await prisma.recoveryAction.findUniqueOrThrow({
      include: { recoveryCase: true },
      where: { id: actionId },
    });
    expect(action.result).toBe("SKIPPED");
    expect(action.recoveryCase).toMatchObject({
      recoveredAmountPaise: 499900,
      status: "RECOVERED",
    });
  });

  it("updates recovered revenue when API verification finds a paid link", async () => {
    const actionId = await createApprovedAction(
      prisma,
      `${suffix}_paid_link`,
      "CREATE_PAYMENT_LINK",
    );
    await prisma.recoveryAction.update({
      data: {
        razorpayReference: "plink_test_paid_api",
        result: "SUCCEEDED",
      },
      where: { id: actionId },
    });
    const recoveryTools: RecoveryExecutionTools = {
      execute: vi.fn(),
      recheckPayment: vi.fn(),
      verifyPaymentLink: vi.fn().mockResolvedValue({
        amount: 499900,
        amount_paid: 499900,
        currency: "INR",
        id: "plink_test_paid_api",
        payments: [{ payment_id: "pay_test_recovered_api" }],
        reference_id: "recovery_test_paid_api",
        short_url: "https://rzp.io/i/test-paid-api",
        status: "paid",
      }),
    };

    await expect(
      verifyRecoveryAction(prisma, actionId, { recoveryTools }),
    ).resolves.toEqual({ status: "RECOVERED" });
    const action = await prisma.recoveryAction.findUniqueOrThrow({
      include: { recoveryCase: true },
      where: { id: actionId },
    });
    expect(action.recoveryCase).toMatchObject({
      recoveredAmountPaise: 499900,
      status: "RECOVERED",
    });
  });
});

async function createApprovedAction(
  prisma: PrismaClient,
  suffix: string,
  actionType: "CREATE_PAYMENT_LINK" | "WAIT",
): Promise<string> {
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
      name: "Step 8 Customer",
      updatedAt: now,
    },
  });
  const payment = await prisma.paymentEvent.create({
    data: {
      amountPaise: 499900,
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
      amountAtRiskPaise: 499900,
      currency: "INR",
      customerId: customer.id,
      dataSource: "RAZORPAY_TEST_MODE",
      diagnosis: "Step 8 orchestration fixture.",
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
  const action = await prisma.recoveryAction.create({
    data: {
      actionType,
      attemptNumber: 1,
      caseId: recoveryCase.id,
      confidence: 80,
      createdAt: now,
      dataSource: "RAZORPAY_TEST_MODE",
      id: `action_${suffix}`,
      idempotencyKey: `recovery:pay_${suffix}:${actionType}:1`,
      policyDecision: "APPROVED",
      policyReason: "Fixture approved for orchestration tests.",
      proposedBy: "POLICY_ENGINE",
      reason: "Fixture",
      result: "PENDING",
      scheduledFor: now,
    },
  });
  return action.id;
}
