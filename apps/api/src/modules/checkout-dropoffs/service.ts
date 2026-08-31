import { notFoundError } from "../../lib/errors.js";
import type {
  CheckoutDropOffRepository,
  CheckoutDropOffService,
} from "./types.js";

function map(
  record: Awaited<ReturnType<CheckoutDropOffRepository["list"]>>[number],
) {
  return {
    amountPaise: record.amountPaise,
    auditTimeline: record.auditEvents.map((event) => ({
      ...event,
      occurredAt: event.occurredAt.toISOString(),
    })),
    caseId: record.publicId,
    checkoutCreatedAt: record.checkoutCreatedAt.toISOString(),
    currency: record.currency,
    customer: record.customer,
    dataSource: record.dataSource,
    draftBody: record.draftBody,
    draftSubject: record.draftSubject,
    orderId: record.razorpayOrderId,
    policyDecision: record.policyDecision,
    policyReason: record.policyReason,
    status: record.status,
  };
}

export function createCheckoutDropOffService(
  repository: CheckoutDropOffRepository,
): CheckoutDropOffService {
  return {
    async createDraft(id) {
      const record = await repository.createDraft(id);
      if (!record)
        throw notFoundError(
          "CHECKOUT_DROPOFF_NOT_FOUND",
          `Checkout drop-off ${id} was not found.`,
        );
      return { data: map(record) };
    },
    async list() {
      return { data: (await repository.list()).map(map) };
    },
  };
}
