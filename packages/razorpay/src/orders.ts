import type { RazorpayRequest } from "./http.js";

export interface CreateRazorpayOrderInput {
  amountPaise: number;
  currency: "INR";
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  amount: number;
  currency: string;
  id: string;
  receipt: string | null;
  status: string;
}

export async function createOrder(
  request: RazorpayRequest,
  input: CreateRazorpayOrderInput,
): Promise<RazorpayOrder> {
  const body = await request.request("/v1/orders", {
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency,
      notes: input.notes ?? {},
      receipt: input.receipt,
    }),
    method: "POST",
  });
  const record = body as Partial<RazorpayOrder>;

  if (
    typeof record.id !== "string" ||
    typeof record.amount !== "number" ||
    typeof record.currency !== "string"
  ) {
    throw new Error("Razorpay order response was incomplete.");
  }

  return {
    amount: record.amount,
    currency: record.currency,
    id: record.id,
    receipt: record.receipt ?? null,
    status: record.status ?? "created",
  };
}
