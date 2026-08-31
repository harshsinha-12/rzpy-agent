import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { RecoveryCaseDetail } from "../schemas";
import { RecoveryActionCard } from "./recovery-action-card";

const action: RecoveryCaseDetail["actions"][number] = {
  actionType: "SEND_REMINDER",
  attemptNumber: 1,
  confidence: 25,
  createdAt: "2026-08-21T08:00:00.000Z",
  dataSource: "RAZORPAY_TEST_MODE",
  executedAt: null,
  id: "action_test_policy",
  input: {},
  output: {},
  paymentLinkShortUrl: null,
  paymentLinkStatus: null,
  policyDecision: "DENIED",
  policyReason: "Merchant failures must not contact the customer.",
  policyViolations: [
    {
      code: "MERCHANT_FAILURE",
      message: "Merchant failures must be escalated.",
    },
  ],
  proposedBy: "RECOVERY_AGENT",
  proposalEvidence: ["Error source is business"],
  proposalModel: "gpt-5.6-terra",
  proposalSource: "OPENAI",
  razorpayReference: null,
  reason: "Ask the customer to retry.",
  result: "SKIPPED",
  safeFallbackAction: "ESCALATE",
  scheduledFor: null,
};

describe("RecoveryActionCard", () => {
  it("explains the AI proposal and deterministic denial", () => {
    const markup = renderToStaticMarkup(
      createElement(RecoveryActionCard, { action }),
    );

    expect(markup).toContain("AI proposal · gpt-5.6-terra");
    expect(markup).toContain("Denied");
    expect(markup).toContain("Safe fallback: Escalate");
    expect(markup).toContain("Merchant Failure:");
  });

  it("links to an executed Razorpay Test Mode Payment Link", () => {
    const markup = renderToStaticMarkup(
      createElement(RecoveryActionCard, {
        action: {
          ...action,
          actionType: "CREATE_PAYMENT_LINK",
          paymentLinkShortUrl: "https://rzp.io/i/test-recovery",
          paymentLinkStatus: "created",
          policyDecision: "APPROVED",
          result: "SUCCEEDED",
        },
      }),
    );

    expect(markup).toContain("Continue Test Mode Payment");
    expect(markup).toContain('href="https://rzp.io/i/test-recovery"');
    expect(markup).toContain('target="_blank"');
  });

  it("replaces a paid link with a completed recovery state", () => {
    const markup = renderToStaticMarkup(
      createElement(RecoveryActionCard, {
        action: {
          ...action,
          actionType: "CREATE_PAYMENT_LINK",
          paymentLinkShortUrl: "https://rzp.io/i/test-recovery",
          paymentLinkStatus: "paid",
          policyDecision: "APPROVED",
          result: "SUCCEEDED",
        },
      }),
    );

    expect(markup).toContain("Test Mode payment recovered");
    expect(markup).toContain("has been paid and needs no retry");
    expect(markup).not.toContain("Continue Test Mode Payment");
    expect(markup).not.toContain('href="https://rzp.io/i/test-recovery"');
  });
});
