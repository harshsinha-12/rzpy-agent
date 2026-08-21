import {
  razorpayClientConfigSchema,
  type RazorpayClientConfig,
} from "./config.js";

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

export interface RazorpayClient {
  createOrder(input: CreateRazorpayOrderInput): Promise<RazorpayOrder>;
}

interface RazorpayHttp {
  fetch: typeof fetch;
}

export function createRazorpayClient(
  config: RazorpayClientConfig,
  http: RazorpayHttp = { fetch },
): RazorpayClient {
  const parsed = razorpayClientConfigSchema.parse(config);
  const authorization = `Basic ${Buffer.from(`${parsed.keyId}:${parsed.keySecret}`).toString("base64")}`;

  return {
    async createOrder(input) {
      const response = await http.fetch("https://api.razorpay.com/v1/orders", {
        body: JSON.stringify({
          amount: input.amountPaise,
          currency: input.currency,
          notes: input.notes ?? {},
          receipt: input.receipt,
        }),
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        throw new Error("Razorpay order creation failed.");
      }

      const record = body as {
        amount?: number;
        currency?: string;
        id?: string;
        receipt?: string | null;
        status?: string;
      };

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
    },
  };
}
