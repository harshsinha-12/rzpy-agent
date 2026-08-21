import { describe, expect, it } from "vitest";

import { checkoutStatusSchema } from "./schemas";

describe("checkoutStatusSchema", () => {
  it("accepts an unconfigured Test Mode status", () => {
    const result = checkoutStatusSchema.safeParse({
      data: {
        configured: false,
        keySetupUrl:
          "https://dashboard.razorpay.com/app/websiteapp-settings/api-keys",
        mode: "test",
        webhookSetupUrl: "https://dashboard.razorpay.com/app/webhooks",
      },
    });

    expect(result.success).toBe(true);
  });
});
