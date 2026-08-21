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

  it("creates a silent Payment Link with a stable reference", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ payment_links: [] }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: async () => ({
          amount: 499900,
          amount_paid: 0,
          currency: "INR",
          id: "plink_test_demo",
          reference_id: "recovery_action1",
          short_url: "https://rzp.io/i/test",
          status: "created",
        }),
        ok: true,
      });
    const client = createRazorpayClient(
      { keyId: "rzp_test_example", keySecret: "test-secret", mode: "test" },
      { fetch: fetchMock as unknown as typeof fetch },
    );

    const result = await client.ensurePaymentLink({
      amountPaise: 499900,
      currency: "INR",
      description: "Recovery test",
      referenceId: "recovery_action1",
    });

    const createCall = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(result).toMatchObject({
      created: true,
      paymentLink: { id: "plink_test_demo" },
    });
    expect(JSON.parse(String(createCall[1].body))).toMatchObject({
      notify: { email: false, sms: false },
      reference_id: "recovery_action1",
      reminder_enable: false,
    });
  });

  it("returns the existing Payment Link instead of creating a duplicate", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        payment_links: [
          {
            amount: 499900,
            amount_paid: 0,
            currency: "INR",
            id: "plink_existing",
            reference_id: "recovery_action1",
            short_url: "https://rzp.io/i/existing",
            status: "created",
          },
        ],
      }),
      ok: true,
    });
    const client = createRazorpayClient(
      { keyId: "rzp_test_example", keySecret: "test-secret", mode: "test" },
      { fetch: fetchMock as unknown as typeof fetch },
    );

    const result = await client.ensurePaymentLink({
      amountPaise: 499900,
      currency: "INR",
      description: "Recovery test",
      referenceId: "recovery_action1",
    });

    expect(result).toMatchObject({
      created: false,
      paymentLink: { id: "plink_existing" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
