import type {
  Actor,
  CheckoutDropOffStatus,
  DataSource,
  PolicyDecision,
} from "@recoveryos/domain";

export interface CheckoutDropOffRecord {
  id: string;
  publicId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  status: CheckoutDropOffStatus;
  draftSubject: string | null;
  draftBody: string | null;
  policyDecision: PolicyDecision | null;
  policyReason: string | null;
  checkoutCreatedAt: Date;
  lastUpdatedAt: Date;
  dataSource: DataSource;
  customer: { name: string; email: string | null; optedOut: boolean };
  auditEvents: Array<{
    actor: Actor;
    eventType: string;
    decision: string | null;
    reasoning: string | null;
    occurredAt: Date;
  }>;
}

export interface CheckoutDropOffRepository {
  createDraft(id: string): Promise<CheckoutDropOffRecord | null>;
  list(): Promise<CheckoutDropOffRecord[]>;
}

export interface CheckoutDropOffService {
  createDraft(id: string): Promise<unknown>;
  list(): Promise<unknown>;
}
