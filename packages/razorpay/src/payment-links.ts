import { z } from "zod";

import type { RazorpayRequest } from "./http.js";

const paymentLinkPaymentSchema = z.object({
  amount: z.number().int().optional(),
  payment_id: z.string().optional(),
  status: z.string().optional(),
});

const paymentLinkSchema = z.object({
  amount: z.number().int(),
  amount_paid: z.number().int().default(0),
  currency: z.string(),
  id: z.string().min(1),
  payments: z.array(paymentLinkPaymentSchema).nullable().optional(),
  reference_id: z.string(),
  short_url: z.string(),
  status: z.enum(["created", "partially_paid", "expired", "cancelled", "paid"]),
});

export interface CreatePaymentLinkInput {
  amountPaise: number;
  currency: "INR";
  description: string;
  notes?: Record<string, string>;
  referenceId: string;
}

export type RazorpayPaymentLink = z.infer<typeof paymentLinkSchema>;

export interface EnsurePaymentLinkResult {
  created: boolean;
  paymentLink: RazorpayPaymentLink;
}

export async function findPaymentLinkByReference(
  request: RazorpayRequest,
  referenceId: string,
): Promise<RazorpayPaymentLink | null> {
  const query = new URLSearchParams({ reference_id: referenceId });
  const body = await request.request(`/v1/payment_links/?${query.toString()}`);
  const collection = z
    .object({ payment_links: z.array(paymentLinkSchema) })
    .parse(body);
  return (
    collection.payment_links.find(
      (paymentLink) => paymentLink.reference_id === referenceId,
    ) ?? null
  );
}

export async function fetchPaymentLink(
  request: RazorpayRequest,
  paymentLinkId: string,
): Promise<RazorpayPaymentLink> {
  return paymentLinkSchema.parse(
    await request.request(
      `/v1/payment_links/${encodeURIComponent(paymentLinkId)}`,
    ),
  );
}

export async function ensurePaymentLink(
  request: RazorpayRequest,
  input: CreatePaymentLinkInput,
): Promise<EnsurePaymentLinkResult> {
  const existing = await findPaymentLinkByReference(request, input.referenceId);
  if (existing) return { created: false, paymentLink: existing };

  try {
    const paymentLink = paymentLinkSchema.parse(
      await request.request("/v1/payment_links", {
        body: JSON.stringify({
          accept_partial: false,
          amount: input.amountPaise,
          currency: input.currency,
          description: input.description,
          notes: input.notes ?? {},
          notify: { email: false, sms: false },
          reference_id: input.referenceId,
          reminder_enable: false,
        }),
        method: "POST",
      }),
    );
    return { created: true, paymentLink };
  } catch (error) {
    const recovered = await findPaymentLinkByReference(
      request,
      input.referenceId,
    );
    if (recovered) return { created: false, paymentLink: recovered };
    throw error;
  }
}
