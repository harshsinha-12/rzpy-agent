import type {
  ActionResult,
  ActionType,
  Actor,
  DataSource,
  FailureCategory,
  PaymentMethod,
  PaymentStatus,
  PolicyDecision,
  RecoverabilityBand,
  RecoveryCaseStatus,
} from "@recoveryos/domain";

export interface SeedCustomer {
  id: string;
  externalRef: string;
  email: string;
  phone: string;
  name: string;
  optedOut: boolean;
}

export interface SeedPaymentEvent {
  id: string;
  customerId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  eventType: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  errorCode: string | null;
  errorSource: string | null;
  errorStep: string | null;
  errorReason: string | null;
  errorDescription: string | null;
  occurredAt: Date;
  rawPayload: Record<string, unknown>;
}

export interface SeedRecoveryAction {
  id: string;
  attemptNumber: number;
  actionType: ActionType;
  proposedBy: Actor;
  reason: string;
  confidence: number;
  policyDecision: PolicyDecision;
  policyReason: string;
  scheduledFor: Date | null;
  executedAt: Date | null;
  result: ActionResult;
  razorpayReference: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  createdAt: Date;
}

export interface SeedAuditEvent {
  id: string;
  actionId: string | null;
  actor: Actor;
  eventType: string;
  input: Record<string, unknown> | null;
  decision: string | null;
  reasoning: string | null;
  output: Record<string, unknown> | null;
  occurredAt: Date;
}

export interface SeedScenario {
  id: string;
  publicId: string;
  customerId: string;
  status: RecoveryCaseStatus;
  failureCategory: FailureCategory;
  recoverabilityBand: RecoverabilityBand;
  recoverabilityScore: number;
  diagnosis: string;
  amountAtRiskPaise: number;
  recoveredAmountPaise: number;
  openedAt: Date;
  closedAt: Date | null;
  lastUpdatedAt: Date;
  dataSource: DataSource;
  payment: SeedPaymentEvent;
  actions: SeedRecoveryAction[];
  auditEvents: SeedAuditEvent[];
}

export interface SeedDataset {
  seed: number;
  merchant: {
    id: string;
    slug: string;
    name: string;
    dataSource: DataSource;
    createdAt: Date;
    updatedAt: Date;
  };
  policy: {
    id: string;
    maxAttemptsPerCase: number;
    maxMessagesPerDay: number;
    minimumRetryDelayMinutes: number;
    recoveryWindowHours: number;
    allowedActions: ActionType[];
  };
  customers: SeedCustomer[];
  scenarios: SeedScenario[];
  simulationRun: {
    id: string;
    seed: number;
    configurationHash: string;
    paymentCount: number;
    revenueAtRiskPaise: number;
    noInterventionRevenuePaise: number;
    recoveredRevenuePaise: number;
    baselineRevenuePaise: number;
    incrementalRevenuePaise: number;
    recoveryRateBps: number;
    attempts: number;
    falseInterventions: number;
    policyStops: number;
    customerContacts: number;
    startedAt: Date;
    completedAt: Date;
    createdAt: Date;
    configuration: Record<string, unknown>;
  };
}
