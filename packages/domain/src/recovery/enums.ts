export const recoveryCaseStatuses = [
  "OPEN",
  "DIAGNOSING",
  "WAITING",
  "ACTION_REQUIRED",
  "RECOVERY_RUNNING",
  "RECOVERED",
  "ESCALATED",
  "STOPPED",
  "EXHAUSTED",
] as const;
export type RecoveryCaseStatus = (typeof recoveryCaseStatuses)[number];

export const failureCategories = [
  "CUSTOMER_AUTH",
  "INSUFFICIENT_FUNDS",
  "GATEWAY_TRANSIENT",
  "ISSUER_FAILURE",
  "MERCHANT_ERROR",
  "NETWORK_ERROR",
  "UNKNOWN",
] as const;
export type FailureCategory = (typeof failureCategories)[number];

export const recoverabilityBands = ["HIGH", "MEDIUM", "LOW", "NONE"] as const;
export type RecoverabilityBand = (typeof recoverabilityBands)[number];

export const actionTypes = [
  "WAIT",
  "CREATE_PAYMENT_LINK",
  "SEND_REMINDER",
  "ALTERNATIVE_METHOD",
  "ESCALATE",
  "STOP",
] as const;
export type ActionType = (typeof actionTypes)[number];

export const policyDecisions = ["APPROVED", "DENIED"] as const;
export type PolicyDecision = (typeof policyDecisions)[number];

export const actionResults = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "SKIPPED",
  "RETRYING",
] as const;
export type ActionResult = (typeof actionResults)[number];

export const actors = [
  "WEBHOOK",
  "DIAGNOSIS_ENGINE",
  "RECOVERY_AGENT",
  "POLICY_ENGINE",
  "EXECUTION_LAYER",
  "SYSTEM",
] as const;
export type Actor = (typeof actors)[number];
