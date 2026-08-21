import { describe, expect, it } from "vitest";

import { isTransientRazorpayStatus } from "./http.js";

describe("isTransientRazorpayStatus", () => {
  it("treats 5xx responses as retryable and 4xx as terminal", () => {
    expect(isTransientRazorpayStatus(500)).toBe(true);
    expect(isTransientRazorpayStatus(503)).toBe(true);
    expect(isTransientRazorpayStatus(400)).toBe(false);
    expect(isTransientRazorpayStatus(409)).toBe(false);
  });
});
