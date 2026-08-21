import { describe, expect, it, vi } from "vitest";

import { createRazorpayClient } from "./client.js";

describe("createRazorpayClient", () => {
  it("creates a test-mode order through the Razorpay API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        amount: 499900,
        currency: "INR",
        id: "order_test_demo",
        receipt: "recoveryos_demo",
        status: "created",
      }),
      ok: true,
    });

    const client = createRazorpayClient(
      {
        keyId: "rzp_test_example",
        keySecret: "test-secret",
        mode: "test",
      },
      { fetch: fetchMock as unknown as typeof fetch },
    );

    const order = await client.createOrder({
      amountPaise: 499900,
      currency: "INR",
      receipt: "recoveryos_demo",
    });

    expect(order.id).toBe("order_test_demo");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.razorpay.com/v1/orders",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
