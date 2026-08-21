import { describe, expect, it } from "vitest";

import { redactSecrets } from "./redact.js";

describe("redactSecrets", () => {
  it("redacts secrets and payment identifiers without dropping operational ids", () => {
    expect(
      redactSecrets({
        attemptCount: 2,
        authorization: "Basic abc123",
        caseId: "case_demo",
        email: "customer@example.com",
        keySecret: "rzp_test_secret",
        payload: {
          contact: "+919999999999",
          payment: { card: "4111111111111111", vpa: "user@upi" },
        },
        webhookEventId: "webhook_test_1",
        "x-razorpay-signature": "deadbeef",
      }),
    ).toEqual({
      attemptCount: 2,
      authorization: "[Redacted]",
      caseId: "case_demo",
      email: "[Redacted]",
      keySecret: "[Redacted]",
      payload: {
        contact: "[Redacted]",
        payment: { card: "[Redacted]", vpa: "[Redacted]" },
      },
      webhookEventId: "webhook_test_1",
      "x-razorpay-signature": "[Redacted]",
    });
  });
});
