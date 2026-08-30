import { describe, expect, it } from "vitest";

import type { RecoveryAgentContext } from "./types.js";
import { buildRecoveryPrompt, RECOVERY_AGENT_INSTRUCTIONS } from "./prompt.js";

const context: RecoveryAgentContext = {
  caseId: "RC-TM-TEST",
  customer: { contactAllowed: true, optedOut: false },
  diagnosis: {
    category: "CUSTOMER_AUTH",
    evidence: ["ERROR_REASON: payment_cancelled"],
    fallbackAction: "CREATE_PAYMENT_LINK",
    recoverabilityScore: 78,
    summary: "Customer authentication was cancelled.",
  },
  history: { failedAttemptsForOrder: 1, previousActions: [] },
  payment: {
    amountPaise: 100,
    currency: "INR",
    errorReason: "payment_cancelled",
    errorSource: "customer",
    errorStep: "payment_authentication",
    method: "CARD",
    status: "FAILED",
  },
  policy: {
    allowedActions: ["WAIT", "CREATE_PAYMENT_LINK", "ALTERNATIVE_METHOD"],
    maxAttemptsPerCase: 3,
    maxMessagesPerDay: 2,
    minimumRetryDelayMinutes: 3,
    recoveryWindowHours: 48,
  },
};

describe("recovery agent prompt", () => {
  it("requires delayed non-terminal proposals and distinguishes a fresh link from a method change", () => {
    expect(RECOVERY_AGENT_INSTRUCTIONS).toContain(
      "delayMinutes must be at least policy.minimumRetryDelayMinutes",
    );
    expect(RECOVERY_AGENT_INSTRUCTIONS).toContain(
      "Use CREATE_PAYMENT_LINK when a failed, contact-safe case needs a fresh customer-initiated payment opportunity",
    );
    expect(RECOVERY_AGENT_INSTRUCTIONS).toContain(
      "Reserve ALTERNATIVE_METHOD for evidence of a method-specific barrier",
    );
  });

  it("includes the merchant minimum delay and Test Mode payment facts", () => {
    const prompt = buildRecoveryPrompt(context);

    expect(prompt).toContain('"minimumRetryDelayMinutes":3');
    expect(prompt).toContain('"amountPaise":100');
    expect(prompt).toContain('"errorReason":"payment_cancelled"');
  });
});
