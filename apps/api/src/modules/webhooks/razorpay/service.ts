import { createHash, randomUUID } from "node:crypto";

import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import {
  razorpayWebhookPayloadSchema,
  verifyRazorpayWebhookSignature,
} from "@recoveryos/razorpay";

import {
  badRequestError,
  notFoundError,
  serviceUnavailableError,
} from "../../../lib/errors.js";
import type {
  PaymentEventJobQueue,
  RazorpayWebhookRepository,
  RazorpayWebhookService,
} from "./types.js";

function providerEventId(header: string | undefined, rawBody: string): string {
  const trimmed = header?.trim();
  if (trimmed) {
    return trimmed;
  }

  return `body_${createHash("sha256").update(rawBody).digest("hex")}`;
}

export function createRazorpayWebhookService(options: {
  queue: PaymentEventJobQueue;
  repository: RazorpayWebhookRepository;
  webhookSecret: string;
}): RazorpayWebhookService {
  return {
    async ingest(input) {
      if (!options.webhookSecret) {
        throw serviceUnavailableError(
          "WEBHOOK_NOT_CONFIGURED",
          "Set RAZORPAY_WEBHOOK_SECRET in the local .env file after creating a Test Mode webhook.",
        );
      }

      if (
        !verifyRazorpayWebhookSignature({
          rawBody: input.rawBody,
          secret: options.webhookSecret,
          signature: input.signature ?? "",
        })
      ) {
        throw badRequestError(
          "INVALID_WEBHOOK_SIGNATURE",
          "The Razorpay webhook signature is invalid.",
        );
      }

      let parsed: { event: string; paymentId: string | null };
      try {
        const payload = razorpayWebhookPayloadSchema.parse(
          JSON.parse(input.rawBody),
        );
        parsed = {
          event: payload.event,
          paymentId: payload.payload?.payment?.entity.id ?? null,
        };
      } catch {
        throw badRequestError(
          "INVALID_WEBHOOK_PAYLOAD",
          "The Razorpay webhook payload could not be parsed.",
        );
      }

      const eventId = providerEventId(input.eventIdHeader, input.rawBody);
      const existing = await options.repository.findByProviderEventId(eventId);
      if (existing) {
        if (
          existing.processingStatus === "FAILED" ||
          existing.processingStatus === "RECEIVED"
        ) {
          await options.queue.enqueue({ webhookEventId: existing.id });
          await options.repository.markQueued(existing.id);
        }
        return { duplicate: true, webhookEventId: existing.id };
      }

      const merchantId =
        await options.repository.findMerchantId(DEMO_MERCHANT_SLUG);
      if (!merchantId) {
        throw notFoundError(
          "MERCHANT_NOT_FOUND",
          "The demo merchant has not been seeded.",
        );
      }

      const created = await options.repository.create({
        eventType: parsed.event,
        id: randomUUID(),
        merchantId,
        payload: JSON.parse(input.rawBody) as Record<string, unknown>,
        paymentId: parsed.paymentId,
        providerEventId: eventId,
        receivedAt: new Date(),
      });
      await options.queue.enqueue({ webhookEventId: created.id });
      await options.repository.markQueued(created.id);

      return { duplicate: false, webhookEventId: created.id };
    },
  };
}
