import type { PaymentEventJobData } from "@recoveryos/domain";

export interface RazorpayWebhookRecord {
  eventType: string;
  id: string;
  processingStatus: string;
  providerEventId: string;
}

export interface RazorpayWebhookRepository {
  create(input: {
    eventType: string;
    id: string;
    merchantId: string;
    payload: Record<string, unknown>;
    paymentId: string | null;
    providerEventId: string;
    receivedAt: Date;
  }): Promise<RazorpayWebhookRecord>;
  findByProviderEventId(
    providerEventId: string,
  ): Promise<RazorpayWebhookRecord | null>;
  findMerchantId(slug: string): Promise<string | null>;
  markQueued(id: string): Promise<void>;
}

export interface PaymentEventJobQueue {
  enqueue(data: PaymentEventJobData): Promise<void>;
}

export interface RazorpayWebhookService {
  ingest(input: {
    eventIdHeader: string | undefined;
    rawBody: string;
    signature: string | undefined;
  }): Promise<{ duplicate: boolean; webhookEventId: string }>;
}
