import { randomUUID } from "node:crypto";

import type { RecoveryAgent } from "@recoveryos/agents";
import {
  createPrismaClient,
  type Prisma,
  type PrismaClient,
} from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import {
  createFailedPaymentWebhookPayload,
  RazorpayApiError,
} from "@recoveryos/razorpay";
import { TransientRecoveryError } from "@recoveryos/recovery-engine";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createRecoveryActionExecutor } from "../tools/recovery-action-executor.js";
import {
  createRecoveryExecutionTools,
  type RecoveryExecutionTools,
} from "../tools/recovery-tools.js";
import { executeRecoveryAction } from "./execute-recovery.js";
import { processPaymentEvent } from "./process-payment-event.js";

const recoveryAgent: RecoveryAgent = {
  async propose() {
    return {
      fallbackReason: null,
      model: "gpt-5.6-terra",
      proposal: {
        action: "CREATE_PAYMENT_LINK",
        confidence: 82,
        delayMinutes: 5,
        diagnosis: "The gateway failure is likely transient.",
        evidence: ["Error source is gateway"],
        reason: "Offer a fresh payment path after the cooldown.",
      },
      source: "OPENAI",
    };
  },
};

describe.sequential("primary recovery flow", () => {
  let prisma: PrismaClient;
  const paymentId = `pay_e2e_${randomUUID().replaceAll("-", "").slice(0, 16)}`;

  beforeAll(async () => {
    prisma = createPrismaClient(
      process.env.DATABASE_URL ??
        "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos",
    );
    await prisma.$connect();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.recoveryCase.deleteMany({
        where: { paymentEvent: { razorpayPaymentId: paymentId } },
      });
      await prisma.paymentEvent.deleteMany({
        where: { razorpayPaymentId: paymentId },
      });
      await prisma.webhookEvent.deleteMany({
        where: { paymentId },
      });
      await prisma.$disconnect();
    }
  });

  it("recovers from a Razorpay 5xx without creating a duplicate Payment Link", async () => {
    const merchant = await prisma.merchant.findUniqueOrThrow({
      where: { slug: DEMO_MERCHANT_SLUG },
    });
    const webhook = await prisma.webhookEvent.create({
      data: {
        dataSource: "RAZORPAY_TEST_MODE",
        eventType: "payment.failed",
        id: `webhook_e2e_${paymentId}`,
        merchantId: merchant.id,
        paymentId,
        processingStatus: "QUEUED",
        providerEventId: `evt_e2e_${paymentId}`,
        rawPayload: createFailedPaymentWebhookPayload({
          createdAt: Math.floor(Date.now() / 1000),
          paymentId,
        }) as Prisma.InputJsonValue,
        receivedAt: new Date(),
      },
    });

    await processPaymentEvent(prisma, webhook.id, { recoveryAgent });
    const action = await prisma.recoveryAction.findFirstOrThrow({
      where: {
        recoveryCase: { paymentEvent: { razorpayPaymentId: paymentId } },
      },
    });
    expect(action).toMatchObject({
      actionType: "CREATE_PAYMENT_LINK",
      policyDecision: "APPROVED",
      result: "PENDING",
    });

    let createAttempts = 0;
    const ensurePaymentLink = vi.fn(async () => {
      createAttempts += 1;
      if (createAttempts === 1) {
        throw new RazorpayApiError("Razorpay API request failed.", 503);
      }
      return {
        created: true,
        paymentLink: {
          amount: 499900,
          amount_paid: 0,
          currency: "INR",
          id: "plink_e2e_primary",
          reference_id: `recovery_${action.id.replaceAll(/[^a-zA-Z0-9]/g, "").slice(0, 31)}`,
          short_url: "https://rzp.io/i/e2e-primary",
          status: "created" as const,
        },
      };
    });
    const tools: RecoveryExecutionTools = createRecoveryExecutionTools({
      createOrder: vi.fn(),
      ensurePaymentLink,
      fetchPayment: vi.fn().mockResolvedValue({
        amount: 499900,
        created_at: 1,
        currency: "INR",
        id: paymentId,
        status: "failed",
      }),
      fetchPaymentLink: vi.fn(),
      findPaymentLinkByReference: vi.fn(),
    });
    const toolExecutor = createRecoveryActionExecutor(prisma, tools);

    await expect(
      executeRecoveryAction(prisma, action.id, { toolExecutor }),
    ).rejects.toBeInstanceOf(TransientRecoveryError);
    await expect(
      executeRecoveryAction(prisma, action.id, { toolExecutor }),
    ).resolves.toEqual({ result: "SUCCEEDED", skipped: false });

    const recoveryCase = await prisma.recoveryCase.findFirstOrThrow({
      include: { actions: true, auditEvents: true },
      where: { paymentEvent: { razorpayPaymentId: paymentId } },
    });

    expect(recoveryCase.dataSource).toBe("RAZORPAY_TEST_MODE");
    expect(recoveryCase.actions).toHaveLength(1);
    expect(recoveryCase.actions[0]).toMatchObject({
      actionType: "CREATE_PAYMENT_LINK",
      razorpayReference: "plink_e2e_primary",
      result: "SUCCEEDED",
    });
    expect(ensurePaymentLink).toHaveBeenCalledTimes(2);
    expect(recoveryCase.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor: "DIAGNOSIS_ENGINE",
          eventType: "diagnosis.completed",
        }),
        expect.objectContaining({
          actor: "RECOVERY_AGENT",
          eventType: "agent.proposal.created",
        }),
        expect.objectContaining({
          actor: "POLICY_ENGINE",
          decision: "APPROVED",
          eventType: "policy.approved",
        }),
        expect.objectContaining({
          actor: "EXECUTION_LAYER",
          decision: "RETRYING",
          eventType: "recovery.execution.failed",
          reasoning: "Razorpay API returned HTTP 503.",
        }),
        expect.objectContaining({
          actor: "EXECUTION_LAYER",
          decision: "SUCCEEDED",
          eventType: "recovery.executed",
        }),
      ]),
    );
  });
});
