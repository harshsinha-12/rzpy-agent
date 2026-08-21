import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@recoveryos/database";
import type { RazorpayPaymentLinkEntity } from "@recoveryos/razorpay";

import type { RecoveryExecutionTools } from "../tools/recovery-tools.js";

function jsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function record(value: Prisma.JsonValue | null): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function markRecovered(
  prisma: PrismaClient,
  input: {
    actionId: string;
    amountPaidPaise: number;
    eventType: "recovery.verified.api" | "payment_link.paid.received";
    paymentId: string | null;
    paymentLinkId: string;
    paymentLinkStatus: string;
  },
): Promise<boolean> {
  const action = await prisma.recoveryAction.findUnique({
    include: { recoveryCase: true },
    where: { id: input.actionId },
  });
  if (!action) return false;
  if (
    action.recoveryCase.status === "RECOVERED" &&
    action.recoveryCase.recoveredAmountPaise > 0
  ) {
    return true;
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.recoveryAction.update({
      data: {
        output: jsonValue({
          ...record(action.output),
          paidPaymentId: input.paymentId,
          paymentLinkStatus: input.paymentLinkStatus,
          verifiedAt: now.toISOString(),
        }),
      },
      where: { id: action.id },
    });
    await tx.recoveryCase.update({
      data: {
        closedAt: now,
        lastUpdatedAt: now,
        recoveredAmountPaise: input.amountPaidPaise,
        status: "RECOVERED",
      },
      where: { id: action.caseId },
    });
    await tx.auditEvent.create({
      data: {
        actionId: action.id,
        actor:
          input.eventType === "payment_link.paid.received"
            ? "WEBHOOK"
            : "EXECUTION_LAYER",
        caseId: action.caseId,
        dataSource: action.dataSource,
        eventType: input.eventType,
        id: randomUUID(),
        input: jsonValue({
          paymentId: input.paymentId,
          paymentLinkId: input.paymentLinkId,
        }),
        occurredAt: now,
        output: jsonValue({ amountPaidPaise: input.amountPaidPaise }),
        reasoning: "A paid Razorpay Payment Link verified recovered revenue.",
      },
    });
  });
  return true;
}

export async function applyPaymentLinkPaidWebhook(
  prisma: PrismaClient,
  paymentLink: RazorpayPaymentLinkEntity,
  paymentId: string | null,
): Promise<boolean> {
  if (paymentLink.status !== "paid") return false;
  const action = await prisma.recoveryAction.findFirst({
    where: { razorpayReference: paymentLink.id },
  });
  if (!action) return false;
  return markRecovered(prisma, {
    actionId: action.id,
    amountPaidPaise: paymentLink.amount_paid || paymentLink.amount,
    eventType: "payment_link.paid.received",
    paymentId,
    paymentLinkId: paymentLink.id,
    paymentLinkStatus: paymentLink.status,
  });
}

export async function verifyRecoveryOutcome(
  prisma: PrismaClient,
  actionId: string,
  tools: RecoveryExecutionTools,
): Promise<{ recovered: boolean; status: string }> {
  const action = await prisma.recoveryAction.findUnique({
    where: { id: actionId },
  });
  if (!action?.razorpayReference) {
    throw new Error("Recovery action has no Razorpay Payment Link reference.");
  }
  const paymentLink = await tools.verifyPaymentLink(action.razorpayReference);
  if (paymentLink.status !== "paid") {
    await prisma.auditEvent.create({
      data: {
        actionId: action.id,
        actor: "EXECUTION_LAYER",
        caseId: action.caseId,
        dataSource: action.dataSource,
        decision: paymentLink.status,
        eventType: "recovery.verified.api",
        id: randomUUID(),
        input: jsonValue({ paymentLinkId: paymentLink.id }),
        occurredAt: new Date(),
        output: jsonValue({ recovered: false, status: paymentLink.status }),
        reasoning: "The Payment Link API state was checked and is not paid.",
      },
    });
    return { recovered: false, status: paymentLink.status };
  }
  const paymentId = paymentLink.payments?.[0]?.payment_id ?? null;
  await markRecovered(prisma, {
    actionId,
    amountPaidPaise: paymentLink.amount_paid || paymentLink.amount,
    eventType: "recovery.verified.api",
    paymentId,
    paymentLinkId: paymentLink.id,
    paymentLinkStatus: paymentLink.status,
  });
  return { recovered: true, status: paymentLink.status };
}
