import { randomUUID } from "node:crypto";

import type { RecoveryAgent } from "@recoveryos/agents";
import type { Prisma, PrismaClient } from "@recoveryos/database";
import { DEFAULT_CURRENCY, DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import {
  mapRazorpayMethod,
  mapRazorpayPaymentStatus,
  nullableText,
  razorpayWebhookPayloadSchema,
  type RazorpayPaymentEntity,
} from "@recoveryos/razorpay";
import { diagnosePaymentFailure } from "@recoveryos/recovery-engine";

import { analyseRecoveryCase } from "./analyse-recovery.js";
import { applyPaymentLinkPaidWebhook } from "./recovery-outcome.js";

export interface ProcessPaymentEventResult {
  casePublicId: string | null;
  status: "FAILED" | "IGNORED" | "PROCESSED";
}

export interface ProcessPaymentEventDependencies {
  enqueueAnalysis?: (caseId: string) => Promise<void>;
  recoveryAgent?: RecoveryAgent;
}

function jsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function customerRef(payment: RazorpayPaymentEntity): string {
  return (
    nullableText(payment.contact) ??
    nullableText(payment.email) ??
    `rzp:${payment.id}`
  );
}

function publicCaseId(paymentId: string): string {
  const suffix = paymentId.replaceAll(/[^a-zA-Z0-9]/g, "").slice(-10);
  return `RC-TM-${suffix || paymentId.slice(-8)}`;
}

export async function processPaymentEvent(
  prisma: PrismaClient,
  webhookEventId: string,
  dependencies: ProcessPaymentEventDependencies = {},
): Promise<ProcessPaymentEventResult> {
  const webhook = await prisma.webhookEvent.findUnique({
    where: { id: webhookEventId },
  });

  if (!webhook) {
    throw new Error(`Webhook event ${webhookEventId} was not found.`);
  }

  if (
    webhook.processingStatus === "PROCESSED" ||
    webhook.processingStatus === "IGNORED"
  ) {
    return { casePublicId: null, status: webhook.processingStatus };
  }

  try {
    const parsed = razorpayWebhookPayloadSchema.safeParse(webhook.rawPayload);
    const payment = parsed.success
      ? parsed.data.payload?.payment?.entity
      : undefined;
    const paymentLink = parsed.success
      ? parsed.data.payload?.payment_link?.entity
      : undefined;

    if (!parsed.success || (!payment && !paymentLink)) {
      await prisma.webhookEvent.update({
        data: {
          processedAt: new Date(),
          processingStatus: "IGNORED",
        },
        where: { id: webhook.id },
      });
      return { casePublicId: null, status: "IGNORED" };
    }

    if (parsed.data.event === "payment_link.paid" && paymentLink) {
      await applyPaymentLinkPaidWebhook(
        prisma,
        paymentLink,
        payment?.id ?? null,
      );
      await prisma.webhookEvent.update({
        data: {
          processedAt: new Date(),
          processingStatus: "PROCESSED",
        },
        where: { id: webhook.id },
      });
      return { casePublicId: null, status: "PROCESSED" };
    }

    if (!payment) {
      await prisma.webhookEvent.update({
        data: { processedAt: new Date(), processingStatus: "IGNORED" },
        where: { id: webhook.id },
      });
      return { casePublicId: null, status: "IGNORED" };
    }

    if (parsed.data.event === "payment.failed") {
      const ingestedCase = await ingestFailedPayment(
        prisma,
        webhook.merchantId,
        payment,
      );
      if (ingestedCase.created) {
        if (dependencies.enqueueAnalysis) {
          await dependencies.enqueueAnalysis(ingestedCase.caseId);
        } else if (dependencies.recoveryAgent) {
          await analyseRecoveryCase(
            prisma,
            ingestedCase.caseId,
            dependencies.recoveryAgent,
          );
        }
      }
      await prisma.webhookEvent.update({
        data: {
          processedAt: new Date(),
          processingStatus: "PROCESSED",
        },
        where: { id: webhook.id },
      });
      return { casePublicId: ingestedCase.publicId, status: "PROCESSED" };
    }

    if (
      parsed.data.event === "payment.captured" ||
      parsed.data.event === "payment.authorized"
    ) {
      await updateExistingPayment(prisma, payment, parsed.data.event);
      await prisma.webhookEvent.update({
        data: {
          processedAt: new Date(),
          processingStatus: "PROCESSED",
        },
        where: { id: webhook.id },
      });
      return { casePublicId: null, status: "PROCESSED" };
    }

    await prisma.webhookEvent.update({
      data: {
        processedAt: new Date(),
        processingStatus: "IGNORED",
      },
      where: { id: webhook.id },
    });
    return { casePublicId: null, status: "IGNORED" };
  } catch (error) {
    await prisma.webhookEvent.update({
      data: {
        errorMessage:
          error instanceof Error ? error.message : "Webhook processing failed.",
        processingStatus: "FAILED",
      },
      where: { id: webhook.id },
    });
    throw error;
  }
}

async function ingestFailedPayment(
  prisma: PrismaClient,
  merchantId: string,
  payment: RazorpayPaymentEntity,
): Promise<{ caseId: string; created: boolean; publicId: string }> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });
  if (!merchant || merchant.slug !== DEMO_MERCHANT_SLUG) {
    throw new Error("The webhook merchant is not the demo merchant.");
  }

  const occurredAt = new Date(payment.created_at * 1000);
  const now = new Date();
  const externalRef = customerRef(payment);
  const customerName =
    nullableText(payment.email)?.split("@")[0] ?? "Test Mode customer";

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      create: {
        createdAt: now,
        dataSource: "RAZORPAY_TEST_MODE",
        email: nullableText(payment.email),
        externalRef,
        id: randomUUID(),
        merchantId,
        name: customerName,
        phone: nullableText(payment.contact),
        updatedAt: now,
      },
      update: {
        email: nullableText(payment.email),
        phone: nullableText(payment.contact),
        updatedAt: now,
      },
      where: {
        merchantId_externalRef: {
          externalRef,
          merchantId,
        },
      },
    });

    const paymentEvent = await tx.paymentEvent.upsert({
      create: {
        amountPaise: payment.amount,
        createdAt: now,
        currency: payment.currency || DEFAULT_CURRENCY,
        customerId: customer.id,
        dataSource: "RAZORPAY_TEST_MODE",
        errorCode: nullableText(payment.error_code),
        errorDescription: nullableText(payment.error_description),
        errorReason: nullableText(payment.error_reason),
        errorSource: nullableText(payment.error_source),
        errorStep: nullableText(payment.error_step),
        eventType: "payment.failed",
        id: `payment_${payment.id}`,
        merchantId,
        occurredAt,
        paymentMethod: mapRazorpayMethod(payment.method),
        rawPayload: jsonValue({ payment }),
        razorpayOrderId: payment.order_id ?? "order_unknown",
        razorpayPaymentId: payment.id,
        status: mapRazorpayPaymentStatus(payment.status),
      },
      update: {
        errorCode: nullableText(payment.error_code),
        errorDescription: nullableText(payment.error_description),
        errorReason: nullableText(payment.error_reason),
        errorSource: nullableText(payment.error_source),
        errorStep: nullableText(payment.error_step),
        eventType: "payment.failed",
        status: mapRazorpayPaymentStatus(payment.status),
      },
      where: { razorpayPaymentId: payment.id },
    });

    const existingCase = await tx.recoveryCase.findUnique({
      where: { paymentEventId: paymentEvent.id },
    });
    if (existingCase) {
      return {
        caseId: existingCase.id,
        created: false,
        publicId: existingCase.publicId,
      };
    }

    const attemptCount = await tx.paymentEvent.count({
      where: {
        merchantId,
        razorpayOrderId: paymentEvent.razorpayOrderId,
        status: "FAILED",
      },
    });
    const diagnosis = diagnosePaymentFailure({
      attemptCount,
      errorCode: paymentEvent.errorCode,
      errorReason: paymentEvent.errorReason,
      errorSource: paymentEvent.errorSource,
      errorStep: paymentEvent.errorStep,
      method: paymentEvent.paymentMethod,
    });
    const diagnosisAt = new Date(now.getTime() + 1);

    const createdCase = await tx.recoveryCase.create({
      data: {
        amountAtRiskPaise: payment.amount,
        currency: payment.currency || DEFAULT_CURRENCY,
        customerId: customer.id,
        dataSource: "RAZORPAY_TEST_MODE",
        diagnosis: diagnosis.diagnosis,
        failureCategory: diagnosis.category,
        id: `case_${payment.id}`,
        lastUpdatedAt: diagnosisAt,
        merchantId,
        openedAt: occurredAt,
        paymentEventId: paymentEvent.id,
        publicId: publicCaseId(payment.id),
        recoverabilityBand: diagnosis.recoverabilityBand,
        recoverabilityScore: diagnosis.recoverabilityScore,
        status: "ACTION_REQUIRED",
      },
    });

    await tx.auditEvent.create({
      data: {
        actor: "WEBHOOK",
        caseId: createdCase.id,
        dataSource: "RAZORPAY_TEST_MODE",
        eventType: "payment.failed.received",
        id: randomUUID(),
        input: jsonValue({ razorpayPaymentId: payment.id }),
        occurredAt: now,
        reasoning:
          "A signed Razorpay Test Mode webhook created this recovery case.",
      },
    });

    await tx.auditEvent.create({
      data: {
        actor: "DIAGNOSIS_ENGINE",
        caseId: createdCase.id,
        dataSource: "RAZORPAY_TEST_MODE",
        decision: diagnosis.category,
        eventType: "diagnosis.completed",
        id: randomUUID(),
        input: jsonValue({
          attemptCount,
          errorCode: paymentEvent.errorCode,
          errorReason: paymentEvent.errorReason,
          errorSource: paymentEvent.errorSource,
          errorStep: paymentEvent.errorStep,
          method: paymentEvent.paymentMethod,
        }),
        occurredAt: diagnosisAt,
        output: jsonValue({
          customerContactAllowed: diagnosis.customerContactAllowed,
          evidence: diagnosis.evidence,
          recommendedAction: diagnosis.recommendedAction,
          recoverabilityBand: diagnosis.recoverabilityBand,
          recoverabilityScore: diagnosis.recoverabilityScore,
        }),
        reasoning: diagnosis.diagnosis,
      },
    });

    return {
      caseId: createdCase.id,
      created: true,
      publicId: createdCase.publicId,
    };
  });
}

async function updateExistingPayment(
  prisma: PrismaClient,
  payment: RazorpayPaymentEntity,
  eventType: string,
): Promise<void> {
  const now = new Date();
  await prisma.paymentEvent.updateMany({
    data: {
      eventType,
      status: mapRazorpayPaymentStatus(payment.status),
    },
    where: { razorpayPaymentId: payment.id },
  });

  if (eventType !== "payment.captured") {
    return;
  }

  await prisma.recoveryCase.updateMany({
    data: {
      closedAt: now,
      lastUpdatedAt: now,
      recoveredAmountPaise: payment.amount,
      status: "RECOVERED",
    },
    where: {
      paymentEvent: { razorpayPaymentId: payment.id },
      status: { not: "RECOVERED" },
    },
  });
}
