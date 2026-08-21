import { describe, expect, it } from "vitest";

import {
  signRazorpayWebhookPayload,
  verifyRazorpayWebhookSignature,
} from "./webhooks.js";

const secret = "test_webhook_secret";
const rawBody = '{"event":"payment.failed"}';

describe("verifyRazorpayWebhookSignature", () => {
  it("accepts a matching HMAC of the raw body", () => {
    const signature = signRazorpayWebhookPayload(rawBody, secret);

    expect(verifyRazorpayWebhookSignature({ rawBody, secret, signature })).toBe(
      true,
    );
  });

  it("rejects a tampered body or missing secret", () => {
    const signature = signRazorpayWebhookPayload(rawBody, secret);

    expect(
      verifyRazorpayWebhookSignature({
        rawBody: '{"event":"payment.captured"}',
        secret,
        signature,
      }),
    ).toBe(false);
    expect(
      verifyRazorpayWebhookSignature({
        rawBody,
        secret: "",
        signature,
      }),
    ).toBe(false);
  });
});
