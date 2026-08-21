import type { StrategyDecision, SyntheticPaymentInput } from "./types.js";

export function noInterventionStrategy(): StrategyDecision {
  return { action: "NONE", customerContacted: false, policyStopped: false };
}

export function naiveRetryStrategy(): StrategyDecision {
  return {
    action: "IMMEDIATE_RETRY",
    customerContacted: false,
    policyStopped: false,
  };
}

export function recoveryOsStrategy(
  payment: SyntheticPaymentInput,
): StrategyDecision {
  if (payment.failureCategory === "MERCHANT_ERROR") {
    return {
      action: "ESCALATE",
      customerContacted: false,
      policyStopped: true,
    };
  }
  if (payment.previousAttempts >= 3) {
    return { action: "STOP", customerContacted: false, policyStopped: true };
  }
  if (payment.failureCategory === "GATEWAY_TRANSIENT") {
    return { action: "WAIT", customerContacted: false, policyStopped: false };
  }
  if (
    payment.failureCategory === "INSUFFICIENT_FUNDS" ||
    payment.failureCategory === "ISSUER_FAILURE"
  ) {
    return {
      action: "ALTERNATIVE_METHOD",
      customerContacted: false,
      policyStopped: false,
    };
  }
  if (
    (payment.failureCategory === "CUSTOMER_AUTH" ||
      payment.failureReason === "customer_abandoned") &&
    !payment.optedOut
  ) {
    return {
      action: "SEND_REMINDER",
      customerContacted: true,
      policyStopped: false,
    };
  }
  return { action: "WAIT", customerContacted: false, policyStopped: false };
}
