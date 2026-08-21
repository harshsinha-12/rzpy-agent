import type { Prisma, PrismaClient } from "@recoveryos/database";

import type { RazorpayWebhookRepository } from "./types.js";

export function createRazorpayWebhookRepository(
  prisma: PrismaClient,
): RazorpayWebhookRepository {
  return {
    async create(input) {
      return prisma.webhookEvent.create({
        data: {
          dataSource: "RAZORPAY_TEST_MODE",
          eventType: input.eventType,
          id: input.id,
          merchantId: input.merchantId,
          paymentId: input.paymentId,
          processingStatus: "RECEIVED",
          providerEventId: input.providerEventId,
          rawPayload: input.payload as Prisma.InputJsonValue,
          receivedAt: input.receivedAt,
        },
        select: {
          eventType: true,
          id: true,
          processingStatus: true,
          providerEventId: true,
        },
      });
    },

    findByProviderEventId(providerEventId) {
      return prisma.webhookEvent.findUnique({
        select: {
          eventType: true,
          id: true,
          processingStatus: true,
          providerEventId: true,
        },
        where: { providerEventId },
      });
    },

    async findMerchantId(slug) {
      const merchant = await prisma.merchant.findUnique({
        select: { id: true },
        where: { slug },
      });
      return merchant?.id ?? null;
    },

    async markQueued(id) {
      await prisma.webhookEvent.update({
        data: { processingStatus: "QUEUED" },
        where: { id },
      });
    },
  };
}
