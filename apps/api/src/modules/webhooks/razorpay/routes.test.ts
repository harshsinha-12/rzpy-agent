import {
  createPrismaClient,
  runDemoSeed,
  type PrismaClient,
} from "@recoveryos/database";
import type { PaymentEventJobData } from "@recoveryos/domain";
import {
  createFailedPaymentWebhookPayload,
  signRazorpayWebhookPayload,
} from "@recoveryos/razorpay";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApp } from "../../../app.js";
import { createHealthService } from "../../health/service.js";

const webhookSecret = "test_webhook_secret";

describe.sequential("POST /webhooks/razorpay", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let prisma: PrismaClient;
  const queued: PaymentEventJobData[] = [];

  beforeAll(async () => {
    const databaseUrl =
      process.env.DATABASE_URL ??
      "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos";
    prisma = createPrismaClient(databaseUrl);
    await prisma.$connect();
    await runDemoSeed(prisma, 20260820);
    app = await buildApp({
      database: prisma,
      healthService: createHealthService({
        close: async () => undefined,
        postgres: async () => undefined,
        redis: async () => undefined,
      }),
      logger: false,
      paymentEventQueue: {
        enqueue: async (data) => {
          queued.push(data);
        },
      },
      razorpayWebhookSecret: webhookSecret,
    });
  });

  beforeEach(() => {
    queued.length = 0;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.webhookEvent.deleteMany({
        where: { providerEventId: { startsWith: "evt_test_" } },
      });
      await prisma.$disconnect();
    }
  });

  it("rejects an invalid signature", async () => {
    const rawBody = JSON.stringify(
      createFailedPaymentWebhookPayload({ paymentId: "pay_test_invalid" }),
    );

    const response = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-razorpay-event-id": "evt_test_invalid",
        "x-razorpay-signature": "deadbeef",
      },
      method: "POST",
      payload: rawBody,
      url: "/webhooks/razorpay",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_WEBHOOK_SIGNATURE");
    expect(queued).toHaveLength(0);
  });

  it("accepts a valid event once and ignores a duplicate delivery", async () => {
    const rawBody = JSON.stringify(
      createFailedPaymentWebhookPayload({ paymentId: "pay_test_duplicate" }),
    );
    const signature = signRazorpayWebhookPayload(rawBody, webhookSecret);
    const headers = {
      "content-type": "application/json",
      "x-razorpay-event-id": "evt_test_duplicate",
      "x-razorpay-signature": signature,
    };

    const first = await app.inject({
      headers,
      method: "POST",
      payload: rawBody,
      url: "/webhooks/razorpay",
    });
    const second = await app.inject({
      headers,
      method: "POST",
      payload: rawBody,
      url: "/webhooks/razorpay",
    });

    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({
      data: { duplicate: false, received: true },
    });
    expect(second.statusCode).toBe(200);
    expect(second.json()).toMatchObject({
      data: { duplicate: true, received: true },
    });
    expect(queued).toHaveLength(1);
    expect(
      await prisma.webhookEvent.count({
        where: { providerEventId: "evt_test_duplicate" },
      }),
    ).toBe(1);
  });

  it("rejects a signed but malformed payload", async () => {
    const rawBody = "{not-json";
    const response = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-razorpay-event-id": "evt_test_malformed",
        "x-razorpay-signature": signRazorpayWebhookPayload(
          rawBody,
          webhookSecret,
        ),
      },
      method: "POST",
      payload: rawBody,
      url: "/webhooks/razorpay",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("INVALID_WEBHOOK_PAYLOAD");
    expect(queued).toHaveLength(0);
  });
});
