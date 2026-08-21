import type { ActionType } from "@recoveryos/domain";

import type {
  PolicyViolation,
  RecoveryActionProposal,
  RecoveryPolicyConfiguration,
  RecoveryPolicyFacts,
  RecoveryPolicyResult,
} from "./types.js";

const CONTACT_ACTIONS = new Set<ActionType>([
  "ALTERNATIVE_METHOD",
  "SEND_REMINDER",
]);
const TERMINAL_ACTIONS = new Set<ActionType>(["ESCALATE", "STOP"]);

function addViolation(
  violations: PolicyViolation[],
  code: PolicyViolation["code"],
  message: string,
): void {
  violations.push({ code, message });
}

function fallbackAction(facts: RecoveryPolicyFacts): ActionType {
  if (facts.paymentStatus === "CAPTURED") return "STOP";
  if (facts.failureCategory === "MERCHANT_ERROR") return "ESCALATE";
  if (facts.approvedActionCount > 0) return "STOP";
  return "WAIT";
}

export function validateRecoveryAction(input: {
  facts: RecoveryPolicyFacts;
  policy: RecoveryPolicyConfiguration;
  proposal: RecoveryActionProposal;
}): RecoveryPolicyResult {
  const { facts, policy, proposal } = input;
  const violations: PolicyViolation[] = [];
  const isTerminal = TERMINAL_ACTIONS.has(proposal.action);
  const isContactAction = CONTACT_ACTIONS.has(proposal.action);
  const proposedAt = new Date(
    facts.now.getTime() + proposal.delayMinutes * 60_000,
  );

  if (facts.paymentStatus === "CAPTURED") {
    addViolation(
      violations,
      "PAYMENT_ALREADY_CAPTURED",
      "The payment is already captured; no recovery action may run.",
    );
  }

  if (!policy.allowedActions.includes(proposal.action)) {
    addViolation(
      violations,
      "ACTION_NOT_ALLOWED",
      `${proposal.action} is not enabled by the merchant recovery policy.`,
    );
  }

  if (
    facts.failureCategory === "MERCHANT_ERROR" &&
    !TERMINAL_ACTIONS.has(proposal.action)
  ) {
    addViolation(
      violations,
      "MERCHANT_FAILURE",
      "Merchant integration failures must be escalated or stopped without customer intervention.",
    );
  }

  if (!isTerminal && facts.approvedActionCount >= policy.maxAttemptsPerCase) {
    addViolation(
      violations,
      "ACTION_LIMIT_REACHED",
      `The case has reached its limit of ${policy.maxAttemptsPerCase} approved recovery actions.`,
    );
  }

  const recoveryDeadline = new Date(
    facts.caseOpenedAt.getTime() + policy.recoveryWindowHours * 3_600_000,
  );
  if (!isTerminal && facts.now >= recoveryDeadline) {
    addViolation(
      violations,
      "RECOVERY_WINDOW_EXPIRED",
      `The ${policy.recoveryWindowHours}-hour recovery window has expired.`,
    );
  }

  if (facts.duplicateActionInFlight) {
    addViolation(
      violations,
      "DUPLICATE_ACTION",
      `An active ${proposal.action} action already exists for this case.`,
    );
  }

  if (isContactAction && facts.customerOptedOut) {
    addViolation(
      violations,
      "CUSTOMER_OPTED_OUT",
      "The customer has opted out of recovery contact.",
    );
  }

  if (isContactAction && !facts.customerContactAllowed) {
    addViolation(
      violations,
      "CUSTOMER_CONTACT_BLOCKED",
      "The deterministic diagnosis does not permit customer contact for this failure.",
    );
  }

  if (
    proposal.action === "SEND_REMINDER" &&
    facts.messagesSentLast24Hours >= policy.maxMessagesPerDay
  ) {
    addViolation(
      violations,
      "MESSAGE_LIMIT_REACHED",
      `The customer has reached the limit of ${policy.maxMessagesPerDay} recovery messages in 24 hours.`,
    );
  }

  if (!isTerminal && proposal.delayMinutes < policy.minimumRetryDelayMinutes) {
    addViolation(
      violations,
      "MINIMUM_DELAY_NOT_MET",
      `The proposal delay is below the ${policy.minimumRetryDelayMinutes}-minute minimum.`,
    );
  }

  if (facts.lastApprovedActionAt && !isTerminal) {
    const cooldownEndsAt = new Date(
      facts.lastApprovedActionAt.getTime() +
        policy.minimumRetryDelayMinutes * 60_000,
    );
    if (proposedAt < cooldownEndsAt) {
      addViolation(
        violations,
        "COOLDOWN_ACTIVE",
        `The prior action cooldown remains active until ${cooldownEndsAt.toISOString()}.`,
      );
    }
  }

  if (violations.length > 0) {
    return {
      decision: "DENIED",
      policyReason: violations.map(({ message }) => message).join(" "),
      safeFallbackAction: fallbackAction(facts),
      scheduledFor: null,
      violations,
    };
  }

  return {
    decision: "APPROVED",
    policyReason:
      "The proposal passed payment-state, merchant, consent, limit, cooldown, recovery-window, and duplicate-action checks.",
    safeFallbackAction: null,
    scheduledFor: isTerminal ? null : proposedAt,
    violations: [],
  };
}
