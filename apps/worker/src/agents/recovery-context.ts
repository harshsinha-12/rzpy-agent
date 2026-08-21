import { createRecoveryAgentTools } from "@recoveryos/agents";
import type { PrismaClient } from "@recoveryos/database";
import { actionTypes } from "@recoveryos/domain";
import { z } from "zod";

const diagnosisOutputSchema = z.object({
  customerContactAllowed: z.boolean(),
  evidence: z.array(
    z.object({
      explanation: z.string(),
      signal: z.string(),
      value: z.string(),
    }),
  ),
  recommendedAction: z.enum(actionTypes),
});

export function readDiagnosisOutput(auditEvents: Array<{ output: unknown }>) {
  for (const event of auditEvents) {
    const result = diagnosisOutputSchema.safeParse(event.output);
    if (result.success) return result.data;
  }
  return null;
}

export function createPrismaRecoveryAgentTools(prisma: PrismaClient) {
  return createRecoveryAgentTools(async (caseId) => {
    const recoveryCase = await prisma.recoveryCase.findUnique({
      include: {
        actions: { orderBy: { createdAt: "asc" }, take: 20 },
        auditEvents: {
          orderBy: { occurredAt: "desc" },
          select: { output: true },
          where: {
            actor: "DIAGNOSIS_ENGINE",
            eventType: "diagnosis.completed",
          },
        },
        customer: true,
        merchant: { include: { recoveryPolicy: true } },
        paymentEvent: true,
      },
      where: { id: caseId },
    });

    if (!recoveryCase) {
      throw new Error(`Recovery case ${caseId} was not found.`);
    }
    if (!recoveryCase.merchant.recoveryPolicy) {
      throw new Error("The recovery case merchant has no recovery policy.");
    }

    const diagnosisOutput = readDiagnosisOutput(recoveryCase.auditEvents);
    const failedAttemptsForOrder = await prisma.paymentEvent.count({
      where: {
        merchantId: recoveryCase.merchantId,
        razorpayOrderId: recoveryCase.paymentEvent.razorpayOrderId,
        status: "FAILED",
      },
    });

    return {
      caseId: recoveryCase.publicId,
      customer: {
        contactAllowed: diagnosisOutput?.customerContactAllowed ?? false,
        optedOut: recoveryCase.customer.optedOut,
      },
      diagnosis: {
        category: recoveryCase.failureCategory,
        evidence:
          diagnosisOutput?.evidence.map(
            (item) => `${item.signal}: ${item.value} — ${item.explanation}`,
          ) ?? [],
        fallbackAction:
          diagnosisOutput?.recommendedAction ??
          (recoveryCase.failureCategory === "MERCHANT_ERROR"
            ? "ESCALATE"
            : "WAIT"),
        recoverabilityScore: recoveryCase.recoverabilityScore,
        summary: recoveryCase.diagnosis,
      },
      history: {
        failedAttemptsForOrder: Math.max(1, failedAttemptsForOrder),
        previousActions: recoveryCase.actions.map((action) => ({
          action: action.actionType,
          createdAt: action.createdAt.toISOString(),
          policyDecision: action.policyDecision,
          result: action.result,
        })),
      },
      payment: {
        amountPaise: recoveryCase.paymentEvent.amountPaise,
        currency: recoveryCase.paymentEvent.currency,
        errorReason: recoveryCase.paymentEvent.errorReason,
        errorSource: recoveryCase.paymentEvent.errorSource,
        errorStep: recoveryCase.paymentEvent.errorStep,
        method: recoveryCase.paymentEvent.paymentMethod,
        status: recoveryCase.paymentEvent.status,
      },
      policy: {
        allowedActions: recoveryCase.merchant.recoveryPolicy.allowedActions,
        maxAttemptsPerCase:
          recoveryCase.merchant.recoveryPolicy.maxAttemptsPerCase,
        maxMessagesPerDay:
          recoveryCase.merchant.recoveryPolicy.maxMessagesPerDay,
        minimumRetryDelayMinutes:
          recoveryCase.merchant.recoveryPolicy.minimumRetryDelayMinutes,
        recoveryWindowHours:
          recoveryCase.merchant.recoveryPolicy.recoveryWindowHours,
      },
    };
  });
}
