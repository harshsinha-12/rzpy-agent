import {
  actionResults,
  actionTypes,
  failureCategories,
  paymentMethods,
  paymentStatuses,
} from "@recoveryos/domain";
import { z } from "zod";

export const recoveryAgentProposalSchema = z.object({
  action: z
    .enum(actionTypes)
    .describe("One action from the supplied bounded action set."),
  confidence: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Confidence in this proposal from 0 to 100."),
  delayMinutes: z
    .number()
    .int()
    .min(0)
    .max(2_880)
    .describe("Minutes to wait before the proposed action is eligible."),
  diagnosis: z
    .string()
    .min(1)
    .max(500)
    .describe("A concise diagnosis grounded only in the supplied facts."),
  evidence: z
    .array(z.string().min(1).max(240))
    .min(1)
    .max(6)
    .describe("The supplied facts that most directly support the proposal."),
  reason: z
    .string()
    .min(1)
    .max(600)
    .describe("Why this action balances recovery and customer impact."),
});

const previousActionSchema = z.object({
  action: z.enum(actionTypes),
  createdAt: z.string().datetime(),
  policyDecision: z.enum(["APPROVED", "DENIED"]),
  result: z.enum(actionResults),
});

export const recoveryAgentContextSchema = z.object({
  caseId: z.string().min(1),
  customer: z.object({
    contactAllowed: z.boolean(),
    optedOut: z.boolean(),
  }),
  diagnosis: z.object({
    category: z.enum(failureCategories),
    evidence: z.array(z.string().min(1)).max(12),
    fallbackAction: z.enum(actionTypes),
    recoverabilityScore: z.number().int().min(0).max(100),
    summary: z.string().min(1),
  }),
  history: z.object({
    failedAttemptsForOrder: z.number().int().positive(),
    previousActions: z.array(previousActionSchema).max(20),
  }),
  payment: z.object({
    amountPaise: z.number().int().nonnegative(),
    currency: z.string().min(1).max(8),
    errorReason: z.string().nullable(),
    errorSource: z.string().nullable(),
    errorStep: z.string().nullable(),
    method: z.enum(paymentMethods),
    status: z.enum(paymentStatuses),
  }),
  policy: z.object({
    allowedActions: z.array(z.enum(actionTypes)),
    maxAttemptsPerCase: z.number().int().nonnegative(),
    maxMessagesPerDay: z.number().int().nonnegative(),
    minimumRetryDelayMinutes: z.number().int().nonnegative(),
    recoveryWindowHours: z.number().int().positive(),
  }),
});
