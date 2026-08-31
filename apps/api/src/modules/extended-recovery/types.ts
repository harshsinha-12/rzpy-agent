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
  voiceGeneratedAt: Date | null;
  voiceAudio: Uint8Array | null;
  voiceAudioMime: string | null;
}

export interface ExtendedRecoveryRepository {
  findForVoice(id: string): Promise<ExtendedRecoveryCaseRecord | null>;
  saveVoice(input: {
    audio: Uint8Array;
    id: string;
    mime: string;
  }): Promise<void>;
  list(): Promise<ExtendedRecoveryCaseRecord[]>;
}

export interface ExtendedRecoveryService {
  generateVoice(id: string): Promise<{ audioUrl: string }>;
  getVoice(id: string): Promise<{ audio: Uint8Array; mime: string } | null>;
  list(): Promise<{ data: unknown[] }>;
}
