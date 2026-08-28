import { afterEach, describe, expect, it, vi } from "vitest";

import { createDemoCheckoutOrder } from "./create-order";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createDemoCheckoutOrder", () => {
  it("creates an order through the same-origin web route", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        {
          data: {
            amountPaise: 100,
            currency: "INR",
            keyId: "rzp_test_example",
            orderId: "order_example",
          },
        },
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(createDemoCheckoutOrder()).resolves.toMatchObject({
      amountPaise: 100,
      currency: "INR",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/demo/razorpay/orders", {
      method: "POST",
    });
  });

  it("reports an actionable error when the proxy cannot create an order", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: {} }, { status: 502 })),
    );

    await expect(createDemoCheckoutOrder()).rejects.toThrow(
      "Check API health and Test Mode keys",
    );
  });
});
