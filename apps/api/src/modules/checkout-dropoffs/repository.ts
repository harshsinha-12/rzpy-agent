import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import type { PrismaClient } from "@recoveryos/database";
import { randomUUID } from "node:crypto";

import type {
  CheckoutDropOffRecord,
  CheckoutDropOffRepository,
} from "./types.js";

const select = {
  amountPaise: true,
  auditEvents: {
    orderBy: { occurredAt: "asc" as const },
    select: {
      actor: true,
      decision: true,
      eventType: true,
      occurredAt: true,
      reasoning: true,
    },
  },
  checkoutCreatedAt: true,
  currency: true,
  customer: { select: { email: true, name: true, optedOut: true } },
  dataSource: true,
  draftBody: true,
  draftSubject: true,
  id: true,
  lastUpdatedAt: true,
  policyDecision: true,
  policyReason: true,
  publicId: true,
  razorpayOrderId: true,
  status: true,
} as const;

export function createCheckoutDropOffRepository(
  prisma: PrismaClient,
): CheckoutDropOffRepository {
  return {
    async createDraft(id) {
      return prisma.$transaction(async (tx) => {
        const record = await tx.checkoutDropOff.findFirst({
          select,
          where: {
            merchant: { slug: DEMO_MERCHANT_SLUG },
            OR: [{ id }, { publicId: id }],
          },
        });
        if (!record) return null;
        if (record.status === "DRAFT_READY")
          return record as CheckoutDropOffRecord;

        const allowed =
          Boolean(record.customer.email) && !record.customer.optedOut;
        const now = new Date();
        const policyReason = allowed
          ? "Merchant selected this unpaid checkout; the customer has an email address and has not opted out. Draft only: no provider is configured."
          : "Draft denied because the customer has no email address or has opted out.";
        const amount = `₹${(record.amountPaise / 100).toFixed(2)}`;
        const draftBody = allowed
          ? `Hi ${record.customer.name},\n\nIt looks like checkout ${record.razorpayOrderId} for ${amount} was not completed. If you would still like to place the order, reply to this email and we will help you complete it.\n\nRegards,\nAurora Retail`
          : null;

        await tx.checkoutDropOff.update({
          data: {
            draftBody,
            draftSubject: allowed
              ? `Complete your Aurora Retail order (${amount})`
              : null,
            lastUpdatedAt: now,
            policyDecision: allowed ? "APPROVED" : "DENIED",
            policyReason,
            status: allowed ? "DRAFT_READY" : "STOPPED",
          },
          where: { id: record.id },
        });
        await tx.checkoutDropOffAudit.create({
          data: {
            actor: "POLICY_ENGINE",
            dataSource: record.dataSource,
            decision: allowed ? "APPROVED" : "DENIED",
            dropOffId: record.id,
            eventType: "checkout_dropoff.draft_reviewed",
            id: randomUUID(),
            occurredAt: now,
            reasoning: policyReason,
          },
        });
        const updated = await tx.checkoutDropOff.findUniqueOrThrow({
          select,
          where: { id: record.id },
        });
        return updated as CheckoutDropOffRecord;
      });
    },
    async list() {
      return (await prisma.checkoutDropOff.findMany({
        orderBy: { checkoutCreatedAt: "desc" },
        select,
        where: { merchant: { slug: DEMO_MERCHANT_SLUG } },
      })) as CheckoutDropOffRecord[];
    },
  };
}
