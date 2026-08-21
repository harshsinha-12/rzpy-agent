import { z } from "zod";

export const razorpayPaymentEntitySchema = z.object({
  amount: z.number().int(),
  contact: z.string().nullable().optional(),
  created_at: z.number().int(),
  currency: z.string(),
  email: z.string().nullable().optional(),
  error_code: z.union([z.string(), z.null()]).optional(),
  error_description: z.union([z.string(), z.null()]).optional(),
  error_reason: z.union([z.string(), z.null()]).optional(),
  error_source: z.union([z.string(), z.null()]).optional(),
  error_step: z.union([z.string(), z.null()]).optional(),
  id: z.string().min(1),
  method: z.string().nullable().optional(),
  order_id: z.string().nullable().optional(),
  status: z.string(),
});

export const razorpayWebhookPayloadSchema = z.object({
  created_at: z.number().int().optional(),
  event: z.string().min(1),
  payload: z
    .object({
      payment: z
        .object({
          entity: razorpayPaymentEntitySchema,
        })
        .optional(),
    })
    .optional(),
});

export type RazorpayPaymentEntity = z.infer<typeof razorpayPaymentEntitySchema>;
export type RazorpayWebhookPayload = z.infer<
  typeof razorpayWebhookPayloadSchema
>;
