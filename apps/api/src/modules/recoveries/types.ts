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

import type { ListRecoveryCasesQuery } from "./schemas.js";

export interface RecoveryActionRecord {
  id: string;
  actionType: ActionType;
  attemptNumber: number;
  proposedBy: Actor;
  reason: string;
  confidence: number;
  policyDecision: PolicyDecision;
  policyReason: string;
  scheduledFor: Date | null;
  executedAt: Date | null;
  result: ActionResult;
  razorpayReference: string | null;
  input: unknown;
  output: unknown;
  dataSource: DataSource;
  createdAt: Date;
}

export interface RecoveryCaseListRecord {
  id: string;
  publicId: string;
  amountAtRiskPaise: number;
  recoveredAmountPaise: number;
  currency: string;
  status: RecoveryCaseStatus;
  failureCategory: FailureCategory;
  recoverabilityBand: RecoverabilityBand;
  recoverabilityScore: number;
  diagnosis: string;
  openedAt: Date;
  lastUpdatedAt: Date;
  dataSource: DataSource;
  paymentEvent: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    errorSource: string | null;
    errorReason: string | null;
    errorDescription: string | null;
  };
  actions: RecoveryActionRecord[];
}

export interface RecoveryCaseDetailRecord extends RecoveryCaseListRecord {
  closedAt: Date | null;
  customer: {
    externalRef: string;
    name: string;
    optedOut: boolean;
    dataSource: DataSource;
  };
  paymentEvent: RecoveryCaseListRecord["paymentEvent"] & {
    amountPaise: number;
    currency: string;
    eventType: string;
    errorCode: string | null;
    errorStep: string | null;
    occurredAt: Date;
  };
  auditEvents: Array<{
    id: string;
    actionId: string | null;
    actor: Actor;
    eventType: string;
    input: unknown;
    decision: string | null;
    reasoning: string | null;
    output: unknown;
    occurredAt: Date;
    dataSource: DataSource;
  }>;
}

export interface RecoveryCaseRepository {
  findById(id: string): Promise<RecoveryCaseDetailRecord | null>;
  list(query: ListRecoveryCasesQuery): Promise<{
    items: RecoveryCaseListRecord[];
    totalItems: number;
  }>;
}

export interface RecoveryCaseService {
  getById(id: string): Promise<unknown>;
  list(query: ListRecoveryCasesQuery): Promise<unknown>;
}
