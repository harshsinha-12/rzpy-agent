import type {
  ActionType,
  FailureCategory,
  PaymentStatus,
  PolicyDecision,
} from "@recoveryos/domain";

export type PolicyViolationCode =
  | "ACTION_LIMIT_REACHED"
  | "ACTION_NOT_ALLOWED"
  | "COOLDOWN_ACTIVE"
  | "CUSTOMER_CONTACT_BLOCKED"
  | "CUSTOMER_OPTED_OUT"
  | "DUPLICATE_ACTION"
  | "MERCHANT_FAILURE"
  | "MESSAGE_LIMIT_REACHED"
  | "MINIMUM_DELAY_NOT_MET"
  | "PAYMENT_ALREADY_CAPTURED"
  | "RECOVERY_WINDOW_EXPIRED";

export interface RecoveryActionProposal {
  action: ActionType;
  confidence: number;
  delayMinutes: number;
  reason: string;
}

export interface RecoveryPolicyConfiguration {
  allowedActions: readonly ActionType[];
  maxAttemptsPerCase: number;
  maxMessagesPerDay: number;
  minimumRetryDelayMinutes: number;
  recoveryWindowHours: number;
}

export interface RecoveryPolicyFacts {
  approvedActionCount: number;
  caseOpenedAt: Date;
  customerContactAllowed: boolean;
  customerOptedOut: boolean;
  duplicateActionInFlight: boolean;
  failureCategory: FailureCategory;
  lastApprovedActionAt: Date | null;
  messagesSentLast24Hours: number;
  now: Date;
  paymentStatus: PaymentStatus;
}

export interface PolicyViolation {
  code: PolicyViolationCode;
  message: string;
}

export interface RecoveryPolicyResult {
  decision: PolicyDecision;
  policyReason: string;
  safeFallbackAction: ActionType | null;
  scheduledFor: Date | null;
  violations: PolicyViolation[];
}
