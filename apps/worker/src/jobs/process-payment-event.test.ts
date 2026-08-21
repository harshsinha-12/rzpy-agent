import {
  createPrismaClient,
  runDemoSeed,
  type Prisma,
  type PrismaClient,
} from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import { createFailedPaymentWebhookPayload } from "@recoveryos/razorpay";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { processPaymentEvent } from "./process-payment-event.js";

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

    const first = await processPaymentEvent(prisma, webhook.id);
    const second = await processPaymentEvent(prisma, webhook.id);
    const cases = await prisma.recoveryCase.findMany({
      include: { auditEvents: true },
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
      ]),
    );
  });

  it("escalates merchant failures without recommending customer contact", async () => {
    const merchant = await prisma.merchant.findUniqueOrThrow({
      where: { slug: DEMO_MERCHANT_SLUG },
    });
    const payload = createFailedPaymentWebhookPayload({
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

    await processPaymentEvent(prisma, webhook.id);
    const recoveryCase = await prisma.recoveryCase.findFirstOrThrow({
      include: { auditEvents: true },
      where: { paymentEvent: { razorpayPaymentId: "pay_test_merchant_error" } },
    });
    const diagnosisEvent = recoveryCase.auditEvents.find(
      (event) => event.eventType === "diagnosis.completed",
    );

    expect(recoveryCase).toMatchObject({
      failureCategory: "MERCHANT_ERROR",
      recoverabilityBand: "NONE",
      recoverabilityScore: 0,
    });
    expect(diagnosisEvent?.output).toEqual(
      expect.objectContaining({
        customerContactAllowed: false,
        recommendedAction: "ESCALATE",
      }),
    );
  });
});
