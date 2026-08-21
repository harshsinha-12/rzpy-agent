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
});
