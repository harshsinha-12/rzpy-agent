import { TEST_MODE_DEMO_AMOUNT_PAISE } from "@recoveryos/domain";
import { describe, expect, it, vi } from "vitest";

import { createDemoCheckoutService } from "./service.js";

describe("demo checkout service", () => {
  it("explains how to add Test Mode keys when they are missing", () => {
    const service = createDemoCheckoutService({ keyId: "" });
    const status = service.getStatus();

    expect(status.amountPaise).toBe(TEST_MODE_DEMO_AMOUNT_PAISE);
    expect(status.configured).toBe(false);
    expect(status.keySetupUrl).toContain("razorpay.com");
  });

  it("creates a test-mode order when a client is available", async () => {
    const createOrder = vi.fn(async () => ({
      amount: TEST_MODE_DEMO_AMOUNT_PAISE,
      currency: "INR" as const,
      id: "order_demo",
    }));
    const service = createDemoCheckoutService({
      keyId: "rzp_test_example",
      orders: { createOrder },
    });

    await expect(service.createOrder()).resolves.toEqual({
      amountPaise: TEST_MODE_DEMO_AMOUNT_PAISE,
      currency: "INR",
      keyId: "rzp_test_example",
      orderId: "order_demo",
    });
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amountPaise: TEST_MODE_DEMO_AMOUNT_PAISE,
        currency: "INR",
      }),
    );
  });
});
