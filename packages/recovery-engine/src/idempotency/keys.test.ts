import { describe, expect, it } from "vitest";

import { recoveryIdempotencyKey } from "./keys.js";

describe("recoveryIdempotencyKey", () => {
  it("builds a stable payment-action-attempt key", () => {
    expect(
      recoveryIdempotencyKey({
        action: "CREATE_PAYMENT_LINK",
        attempt: 1,
        paymentId: "pay_test",
      }),
    ).toBe("recovery:pay_test:CREATE_PAYMENT_LINK:1");
  });
});
