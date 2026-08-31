import type { DataSource } from "@recoveryos/domain";

export type ExtendedRecoveryKind =
  "SUBSCRIPTION" | "RECEIVABLE" | "MANDATE" | "VOICE" | "UDHAAR";
export type ExtendedRecoveryStatus =
  "OPEN" | "DRAFT_READY" | "HUMAN_REVIEW" | "SNOOZED" | "STOPPED" | "RECOVERED";

export interface ExtendedRecoveryCaseRecord {
  amountPaise: number;
  currency: string;
  customer: { email: string | null; name: string };
  dataSource: DataSource;
  draftBody: string | null;
  draftSubject: string | null;
  dueAt: Date | null;
  kind: ExtendedRecoveryKind;
  publicId: string;
  reason: string;
  reference: string;
  status: ExtendedRecoveryStatus;
  voiceScript: string | null;
}

export interface ExtendedRecoveryRepository {
  list(): Promise<ExtendedRecoveryCaseRecord[]>;
}

export interface ExtendedRecoveryService {
  list(): Promise<{ data: unknown[] }>;
}
