import type { RecoveryAgent } from "@recoveryos/agents";
import {
  createPrismaClient,
  runDemoSeed,
  type Prisma,
  type PrismaClient,
} from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import {
  createFailedPaymentWebhookPayload,
  createPaymentLinkPaidWebhookPayload,
} from "@recoveryos/razorpay";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { processPaymentEvent } from "./process-payment-event.js";

const recoveryAgent: RecoveryAgent = {
  async propose(caseId) {
    const merchantFailure = caseId.includes("merchant_error");
    return {
      fallbackReason: null,
      model: "gpt-5.6-terra",
      proposal: {
        action: merchantFailure ? "SEND_REMINDER" : "CREATE_PAYMENT_LINK",
        confidence: merchantFailure ? 25 : 82,
        delayMinutes: merchantFailure ? 0 : 5,
        diagnosis: merchantFailure
          ? "A merchant integration setting blocked the payment."
          : "The gateway failure is likely transient.",
        evidence: [
          merchantFailure
            ? "Error source is business"
            : "Error source is gateway",
        ],
        reason: merchantFailure
          ? "Ask the customer to try again."
          : "Wait through the cooldown, then offer a fresh payment path.",
      },
      source: "OPENAI",
    };
  },
};

describe.sequential("processPaymentEvent", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    const databaseUrl =
      process.env.DATABASE_URL ??
      "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos";
    prisma = createPrismaClient(databaseUrl);
    await prisma.$connect();
    await runDemoSeed(prisma, 20260820);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.recoveryCase.deleteMany({
        where: { publicId: { startsWith: "RC-TM-" } },
      });
      await prisma.paymentEvent.deleteMany({
        where: { razorpayPaymentId: { startsWith: "pay_test_" } },
      });
      await prisma.customer.deleteMany({
        where: { externalRef: { startsWith: "+919000000099" } },
      });
      await prisma.webhookEvent.deleteMany({
        where: { id: { startsWith: "webhook_test_" } },
      });
      await prisma.$disconnect();
    }
  });

  it("creates one RAZORPAY_TEST_MODE case and does not duplicate on retry", async () => {
    const merchant = await prisma.merchant.findUniqueOrThrow({
      where: { slug: DEMO_MERCHANT_SLUG },
    });
    const payload = createFailedPaymentWebhookPayload({
      createdAt: Math.floor(Date.now() / 1000),
      paymentId: "pay_test_ingest_1",
    });
    const webhook = await prisma.webhookEvent.create({
      data: {
        dataSource: "RAZORPAY_TEST_MODE",
        eventType: "payment.failed",
        id: "webhook_test_ingest_1",
        merchantId: merchant.id,
        paymentId: "pay_test_ingest_1",
        processingStatus: "QUEUED",
        providerEventId: "evt_test_ingest_1",
        rawPayload: payload as Prisma.InputJsonValue,
        receivedAt: new Date(),
      },
    });

    const first = await processPaymentEvent(prisma, webhook.id, {
      recoveryAgent,
    });
    const second = await processPaymentEvent(prisma, webhook.id, {
      recoveryAgent,
    });
    const cases = await prisma.recoveryCase.findMany({
      include: { actions: true, auditEvents: true },
      where: { paymentEvent: { razorpayPaymentId: "pay_test_ingest_1" } },
    });

    expect(first).toMatchObject({
      casePublicId: expect.stringMatching(/^RC-TM-/),
      status: "PROCESSED",
    });
    expect(second.status).toBe("PROCESSED");
    expect(cases).toHaveLength(1);
    expect(cases[0]?.dataSource).toBe("RAZORPAY_TEST_MODE");
    expect(cases[0]).toMatchObject({
      failureCategory: "GATEWAY_TRANSIENT",
      recoverabilityBand: "HIGH",
      recoverabilityScore: 86,
      status: "ACTION_REQUIRED",
    });
    expect(cases[0]?.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor: "DIAGNOSIS_ENGINE",
          decision: "GATEWAY_TRANSIENT",
          eventType: "diagnosis.completed",
          output: expect.objectContaining({
            recommendedAction: "WAIT",
          }),
        }),
        expect.objectContaining({
          actor: "RECOVERY_AGENT",
          decision: "CREATE_PAYMENT_LINK",
          eventType: "agent.proposal.created",
        }),
        expect.objectContaining({
          actor: "POLICY_ENGINE",
          decision: "APPROVED",
          eventType: "policy.approved",
        }),
      ]),
    );
    expect(cases[0]?.actions).toEqual([
      expect.objectContaining({
        actionType: "CREATE_PAYMENT_LINK",
        policyDecision: "APPROVED",
        proposedBy: "RECOVERY_AGENT",
        result: "PENDING",
      }),
    ]);
  });

  it("escalates merchant failures without recommending customer contact", async () => {
    const merchant = await prisma.merchant.findUniqueOrThrow({
      where: { slug: DEMO_MERCHANT_SLUG },
    });
    const payload = createFailedPaymentWebhookPayload({
      createdAt: Math.floor(Date.now() / 1000),
      errorReason: "payment_method_disabled",
      errorSource: "business",
      orderId: "order_test_merchant_error",
      paymentId: "pay_test_merchant_error",
    });
    const webhook = await prisma.webhookEvent.create({
      data: {
        dataSource: "RAZORPAY_TEST_MODE",
        eventType: "payment.failed",
        id: "webhook_test_merchant_error",
        merchantId: merchant.id,
        paymentId: "pay_test_merchant_error",
        processingStatus: "QUEUED",
        providerEventId: "evt_test_merchant_error",
        rawPayload: payload as Prisma.InputJsonValue,
        receivedAt: new Date(),
      },
    });

    await processPaymentEvent(prisma, webhook.id, { recoveryAgent });
    const recoveryCase = await prisma.recoveryCase.findFirstOrThrow({
      include: { actions: true, auditEvents: true },
      where: { paymentEvent: { razorpayPaymentId: "pay_test_merchant_error" } },
    });
    const diagnosisEvent = recoveryCase.auditEvents.find(
      (event) => event.eventType === "diagnosis.completed",
    );

    expect(recoveryCase).toMatchObject({
      failureCategory: "MERCHANT_ERROR",
      recoverabilityBand: "NONE",
      recoverabilityScore: 0,
      status: "ESCALATED",
    });
    expect(diagnosisEvent?.output).toEqual(
      expect.objectContaining({
        customerContactAllowed: false,
        recommendedAction: "ESCALATE",
      }),
    );
    expect(recoveryCase.actions).toEqual([
      expect.objectContaining({
        actionType: "SEND_REMINDER",
        policyDecision: "DENIED",
        result: "SKIPPED",
      }),
    ]);
    expect(recoveryCase.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor: "POLICY_ENGINE",
          decision: "DENIED",
          eventType: "policy.denied",
        }),
      ]),
    );
  });

  it("updates recovered revenue from a payment_link.paid webhook", async () => {
    const merchant = await prisma.merchant.findUniqueOrThrow({
      where: { slug: DEMO_MERCHANT_SLUG },
    });
    const paymentId = "pay_test_webhook_origin";
    const failedWebhook = await prisma.webhookEvent.create({
      data: {
        dataSource: "RAZORPAY_TEST_MODE",
        eventType: "payment.failed",
        id: "webhook_test_link_origin",
        merchantId: merchant.id,
        paymentId,
        processingStatus: "QUEUED",
        providerEventId: "evt_test_link_origin",
        rawPayload: createFailedPaymentWebhookPayload({
          createdAt: Math.floor(Date.now() / 1000),
          paymentId,
        }) as Prisma.InputJsonValue,
        receivedAt: new Date(),
      },
    });
    await processPaymentEvent(prisma, failedWebhook.id, { recoveryAgent });
    const action = await prisma.recoveryAction.findFirstOrThrow({
      where: {
        recoveryCase: { paymentEvent: { razorpayPaymentId: paymentId } },
      },
    });
    await prisma.recoveryAction.update({
      data: {
        razorpayReference: "plink_test_webhook_paid",
        result: "SUCCEEDED",
      },
      where: { id: action.id },
    });
    const paidWebhook = await prisma.webhookEvent.create({
      data: {
        dataSource: "RAZORPAY_TEST_MODE",
        eventType: "payment_link.paid",
        id: "webhook_test_link_paid",
        merchantId: merchant.id,
        paymentId: "pay_test_webhook_recovered",
        processingStatus: "QUEUED",
        providerEventId: "evt_test_link_paid",
        rawPayload: createPaymentLinkPaidWebhookPayload({
          paymentId: "pay_test_webhook_recovered",
          paymentLinkId: "plink_test_webhook_paid",
          referenceId: "recovery_test_webhook_paid",
        }) as Prisma.InputJsonValue,
        receivedAt: new Date(),
      },
    });

    await processPaymentEvent(prisma, paidWebhook.id);
    await expect(
      prisma.recoveryCase.findUniqueOrThrow({ where: { id: action.caseId } }),
    ).resolves.toMatchObject({
      recoveredAmountPaise: 499900,
      status: "RECOVERED",
    });
  });
});
