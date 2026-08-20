import { describe, expect, it } from "vitest";

import { razorpayClientConfigSchema } from "./config.js";

describe("razorpayClientConfigSchema", () => {
  it("accepts non-empty test-mode credentials", () => {
    const result = razorpayClientConfigSchema.safeParse({
      keyId: "rzp_test_example",
      keySecret: "test-secret",
      mode: "test",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing credentials and non-test modes", () => {
    const result = razorpayClientConfigSchema.safeParse({
      keyId: "",
      keySecret: "",
      mode: "live",
    });

    expect(result.success).toBe(false);
  });
});
