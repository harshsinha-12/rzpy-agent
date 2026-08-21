import { z } from "zod";

export const checkoutStatusSchema = z.object({
  data: z.object({
    configured: z.boolean(),
    keySetupUrl: z.string().url(),
    mode: z.literal("test"),
    webhookSetupUrl: z.string().url(),
  }),
});

export const checkoutOrderSchema = z.object({
  data: z.object({
    amountPaise: z.number().int(),
    currency: z.literal("INR"),
    keyId: z.string().min(1),
    orderId: z.string().min(1),
  }),
});

export type CheckoutStatus = z.infer<typeof checkoutStatusSchema>["data"];
export type CheckoutOrder = z.infer<typeof checkoutOrderSchema>["data"];
