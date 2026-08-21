import { describe, expect, it } from "vitest";

import type {
  RecoveryActionProposal,
  RecoveryPolicyConfiguration,
  RecoveryPolicyFacts,
} from "./types.js";
import { validateRecoveryAction } from "./validate.js";

const now = new Date("2026-08-21T08:00:00.000Z");
const policy: RecoveryPolicyConfiguration = {
  allowedActions: [
    "WAIT",
    "CREATE_PAYMENT_LINK",
    "SEND_REMINDER",
    "ALTERNATIVE_METHOD",
    "ESCALATE",
    "STOP",
  ],
  maxAttemptsPerCase: 3,
  maxMessagesPerDay: 2,
  minimumRetryDelayMinutes: 3,
  recoveryWindowHours: 48,
};
const facts: RecoveryPolicyFacts = {
  approvedActionCount: 0,
  caseOpenedAt: new Date("2026-08-21T07:00:00.000Z"),
  customerContactAllowed: true,
  customerOptedOut: false,
  duplicateActionInFlight: false,
  failureCategory: "GATEWAY_TRANSIENT",
  lastApprovedActionAt: null,
  messagesSentLast24Hours: 0,
  now,
  paymentStatus: "FAILED",
};
const proposal: RecoveryActionProposal = {
  action: "CREATE_PAYMENT_LINK",
  confidence: 82,
  delayMinutes: 5,
  reason: "Offer a fresh payment path after the cooldown.",
};

function decide(
  factOverrides: Partial<RecoveryPolicyFacts> = {},
  proposalOverrides: Partial<RecoveryActionProposal> = {},
  policyOverrides: Partial<RecoveryPolicyConfiguration> = {},
) {
  return validateRecoveryAction({
    facts: { ...facts, ...factOverrides },
    policy: { ...policy, ...policyOverrides },
    proposal: { ...proposal, ...proposalOverrides },
  });
}

describe("validateRecoveryAction", () => {
  it("approves a bounded proposal and schedules it after its delay", () => {
    const result = decide();

    expect(result).toMatchObject({
      decision: "APPROVED",
      safeFallbackAction: null,
      scheduledFor: new Date("2026-08-21T08:05:00.000Z"),
      violations: [],
    });
  });

  it.each([
    [
      "captured payment",
      { paymentStatus: "CAPTURED" },
      {},
      {},
      "PAYMENT_ALREADY_CAPTURED",
    ],
    [
      "action limit",
      { approvedActionCount: 3 },
      {},
      {},
      "ACTION_LIMIT_REACHED",
    ],
    [
      "expired recovery window",
      { caseOpenedAt: new Date("2026-08-18T08:00:00.000Z") },
      {},
      {},
      "RECOVERY_WINDOW_EXPIRED",
    ],
    [
      "customer opt-out",
      { customerOptedOut: true },
      { action: "SEND_REMINDER" },
      {},
      "CUSTOMER_OPTED_OUT",
    ],
    [
      "contact guardrail",
      { customerContactAllowed: false },
      { action: "ALTERNATIVE_METHOD" },
      {},
      "CUSTOMER_CONTACT_BLOCKED",
    ],
    [
      "message limit",
      { messagesSentLast24Hours: 2 },
      { action: "SEND_REMINDER" },
      {},
      "MESSAGE_LIMIT_REACHED",
    ],
    ["minimum delay", {}, { delayMinutes: 1 }, {}, "MINIMUM_DELAY_NOT_MET"],
    [
      "duplicate action",
      { duplicateActionInFlight: true },
      {},
      {},
      "DUPLICATE_ACTION",
    ],
    [
      "disallowed action",
      {},
      {},
      { allowedActions: ["WAIT"] },
      "ACTION_NOT_ALLOWED",
    ],
  ] as const)(
    "denies a %s",
    (_, factInput, proposalInput, policyInput, code) => {
      const result = decide(factInput, proposalInput, policyInput);

      expect(result.decision).toBe("DENIED");
      expect(result.violations).toEqual(
        expect.arrayContaining([expect.objectContaining({ code })]),
      );
      expect(result.scheduledFor).toBeNull();
    },
  );

  it("blocks customer-facing recovery for merchant failures", () => {
    const result = decide(
      { customerContactAllowed: false, failureCategory: "MERCHANT_ERROR" },
      { action: "SEND_REMINDER" },
    );

    expect(result).toMatchObject({
      decision: "DENIED",
      safeFallbackAction: "ESCALATE",
    });
    expect(result.violations.map(({ code }) => code)).toContain(
      "MERCHANT_FAILURE",
    );
  });

  it("enforces the cooldown relative to the last approved action", () => {
    const result = decide({
      lastApprovedActionAt: new Date("2026-08-21T08:04:00.000Z"),
    });

    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "COOLDOWN_ACTIVE" }),
      ]),
    );
  });

  it("allows immediate terminal escalation for a merchant failure", () => {
    const result = decide(
      { customerContactAllowed: false, failureCategory: "MERCHANT_ERROR" },
      { action: "ESCALATE", delayMinutes: 0 },
    );

    expect(result.decision).toBe("APPROVED");
    expect(result.scheduledFor).toBeNull();
  });

  it("allows link creation after cooldown without treating creation as a message", () => {
    const result = decide({ customerContactAllowed: false });

    expect(result.decision).toBe("APPROVED");
    expect(result.scheduledFor).toEqual(new Date("2026-08-21T08:05:00.000Z"));
  });
});
