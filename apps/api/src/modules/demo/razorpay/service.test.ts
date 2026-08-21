import { describe, expect, it } from "vitest";

import { createDemoCheckoutService } from "./service.js";

describe("demo checkout service", () => {
  it("explains how to add Test Mode keys when they are missing", () => {
    const service = createDemoCheckoutService({ keyId: "" });
    const status = service.getStatus();

    expect(status.configured).toBe(false);
    expect(status.keySetupUrl).toContain("razorpay.com");
  });

  it("creates a test-mode order when a client is available", async () => {
    const service = createDemoCheckoutService({
      keyId: "rzp_test_example",
      orders: {
        createOrder: async () => ({
          amount: 499900,
          currency: "INR",
          id: "order_demo",
        }),
      },
    });

    await expect(service.createOrder()).resolves.toMatchObject({
      keyId: "rzp_test_example",
      orderId: "order_demo",
    });
  });
});
