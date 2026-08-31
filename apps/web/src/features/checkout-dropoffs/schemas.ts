import { z } from "zod";

export const checkoutDropOffSchema = z.object({
  amountPaise: z.number().int().nonnegative(),
  auditTimeline: z.array(
    z.object({
      actor: z.string(),
      decision: z.string().nullable(),
      eventType: z.string(),
      occurredAt: z.string().datetime(),
      reasoning: z.string().nullable(),
    }),
  ),
  caseId: z.string(),
  checkoutCreatedAt: z.string().datetime(),
  currency: z.string(),
  customer: z.object({
    email: z.string().email().nullable(),
    name: z.string(),
    optedOut: z.boolean(),
  }),
  dataSource: z.enum(["SIMULATED", "RAZORPAY_TEST_MODE"]),
  draftBody: z.string().nullable(),
  draftSubject: z.string().nullable(),
  orderId: z.string(),
  policyDecision: z.enum(["APPROVED", "DENIED"]).nullable(),
  policyReason: z.string().nullable(),
  paymentLinkUrl: z.string().url().nullable(),
  status: z.enum(["OPEN", "DRAFT_READY", "STOPPED"]),
});

export const checkoutDropOffsResponseSchema = z.object({
  data: z.array(checkoutDropOffSchema),
});
export type CheckoutDropOff = z.infer<typeof checkoutDropOffSchema>;
