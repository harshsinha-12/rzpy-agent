import {
  actionResults,
  actionTypes,
  actors,
  dataSources,
  failureCategories,
  paymentMethods,
  paymentStatuses,
  policyDecisions,
  recoverabilityBands,
  recoveryCaseStatuses,
} from "@recoveryos/domain";
import { z } from "zod";

export const recoveryCaseListItemSchema = z.object({
  amountAtRiskPaise: z.number().int().nonnegative(),
  caseId: z.string(),
  currency: z.string(),
  dataSource: z.enum(dataSources),
  diagnosis: z.string(),
  failureCategory: z.enum(failureCategories),
  failureDescription: z.string().nullable(),
  failureReason: z.string().nullable(),
  failureSource: z.string().nullable(),
  lastUpdatedAt: z.string().datetime(),
  openedAt: z.string().datetime(),
  orderId: z.string(),
  paymentId: z.string(),
  paymentMethod: z.enum(paymentMethods),
  paymentStatus: z.enum(paymentStatuses),
  policyDecision: z.enum(policyDecisions).nullable(),
  proposedAction: z.enum(actionTypes).nullable(),
  recoverabilityBand: z.enum(recoverabilityBands),
  recoverabilityScore: z.number().int().min(0).max(100),
  recoveredAmountPaise: z.number().int().nonnegative(),
  recoveryStatus: z.enum(recoveryCaseStatuses),
});

export const recoveryCasesResponseSchema = z.object({
  data: z.array(recoveryCaseListItemSchema),
  meta: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    sortBy: z.enum(["amountAtRiskPaise", "lastUpdatedAt"]),
    sortOrder: z.enum(["asc", "desc"]),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

const recoveryActionSchema = z.object({
  actionType: z.enum(actionTypes),
  attemptNumber: z.number().int().positive(),
  confidence: z.number().int().min(0).max(100),
  createdAt: z.string().datetime(),
  dataSource: z.enum(dataSources),
  executedAt: z.string().datetime().nullable(),
  id: z.string(),
  input: z.unknown(),
  output: z.unknown(),
  policyDecision: z.enum(policyDecisions),
  policyViolations: z.array(
    z.object({ code: z.string(), message: z.string() }),
  ),
  policyReason: z.string(),
  proposedBy: z.enum(actors),
  proposalEvidence: z.array(z.string()),
  proposalModel: z.string().nullable(),
  proposalSource: z.enum(["OPENAI", "DETERMINISTIC_FALLBACK"]).nullable(),
  razorpayReference: z.string().nullable(),
  reason: z.string(),
  result: z.enum(actionResults),
  safeFallbackAction: z.enum(actionTypes).nullable(),
  scheduledFor: z.string().datetime().nullable(),
});

const auditEventSchema = z.object({
  actionId: z.string().nullable(),
  actor: z.enum(actors),
  dataSource: z.enum(dataSources),
  decision: z.string().nullable(),
  eventType: z.string(),
  id: z.string(),
  input: z.unknown(),
  occurredAt: z.string().datetime(),
  output: z.unknown(),
  reasoning: z.string().nullable(),
});

export const recoveryCaseDetailResponseSchema = z.object({
  data: recoveryCaseListItemSchema.extend({
    actions: z.array(recoveryActionSchema),
    auditTimeline: z.array(auditEventSchema),
    closedAt: z.string().datetime().nullable(),
    customerContactAllowed: z.boolean().nullable(),
    customer: z.object({
      dataSource: z.enum(dataSources),
      externalRef: z.string(),
      name: z.string(),
      optedOut: z.boolean(),
    }),
    diagnosisEvidence: z.array(
      z.object({
        explanation: z.string(),
        signal: z.enum([
          "ATTEMPT_COUNT",
          "CLASSIFICATION_RULE",
          "ERROR_CODE",
          "ERROR_REASON",
          "ERROR_SOURCE",
          "ERROR_STEP",
          "PAYMENT_METHOD",
        ]),
        value: z.string(),
      }),
    ),
    payment: z.object({
      amountPaise: z.number().int().nonnegative(),
      currency: z.string(),
      errorCode: z.string().nullable(),
      errorDescription: z.string().nullable(),
      errorReason: z.string().nullable(),
      errorSource: z.string().nullable(),
      errorStep: z.string().nullable(),
      eventType: z.string(),
      method: z.enum(paymentMethods),
      occurredAt: z.string().datetime(),
      orderId: z.string(),
      paymentId: z.string(),
      status: z.enum(paymentStatuses),
    }),
    recommendedAction: z.enum(actionTypes).nullable(),
  }),
});

export type RecoveryCaseListItem = z.infer<typeof recoveryCaseListItemSchema>;
export type RecoveryCasesResponse = z.infer<typeof recoveryCasesResponseSchema>;
export type RecoveryCaseDetail = z.infer<
  typeof recoveryCaseDetailResponseSchema
>["data"];
