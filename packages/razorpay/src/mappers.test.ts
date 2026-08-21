import { describe, expect, it } from "vitest";

import { mapRazorpayMethod, mapRazorpayPaymentStatus } from "./mappers.js";

describe("razorpay mappers", () => {
  it("maps known methods and statuses into domain enums", () => {
    expect(mapRazorpayMethod("upi")).toBe("UPI");
    expect(mapRazorpayMethod("card")).toBe("CARD");
    expect(mapRazorpayMethod("unknown-method")).toBe("UNKNOWN");
    expect(mapRazorpayPaymentStatus("failed")).toBe("FAILED");
    expect(mapRazorpayPaymentStatus("captured")).toBe("CAPTURED");
  });
});
