import { z } from "zod";

export const extendedRecoveryResponseSchema = z.object({
  data: z.array(
    z.object({
      amountPaise: z.number().int(),
      currency: z.string(),
      customer: z.object({
        email: z.string().email().nullable(),
        name: z.string(),
      }),
      dataSource: z.enum(["SIMULATED", "RAZORPAY_TEST_MODE"]),
      draftBody: z.string().nullable(),
      draftSubject: z.string().nullable(),
      dueAt: z.string().datetime().nullable(),
      kind: z.enum([
        "SUBSCRIPTION",
        "RECEIVABLE",
        "MANDATE",
        "VOICE",
        "UDHAAR",
      ]),
      publicId: z.string(),
      reason: z.string(),
      reference: z.string(),
      status: z.enum([
        "OPEN",
        "DRAFT_READY",
        "HUMAN_REVIEW",
        "SNOOZED",
        "STOPPED",
        "RECOVERED",
      ]),
      voiceScript: z.string().nullable(),
    }),
  ),
});
export type ExtendedRecoveryCase = z.infer<
  typeof extendedRecoveryResponseSchema
>["data"][number];
