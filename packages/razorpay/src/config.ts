import { z } from "zod";

export const razorpayClientConfigSchema = z.object({
  keyId: z.string().min(1),
  keySecret: z.string().min(1),
  mode: z.literal("test"),
});

export type RazorpayClientConfig = z.infer<typeof razorpayClientConfigSchema>;
