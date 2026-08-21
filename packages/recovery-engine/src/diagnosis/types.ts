import type {
  ActionType,
  FailureCategory,
  PaymentMethod,
  RecoverabilityBand,
} from "@recoveryos/domain";

export type DiagnosisEvidenceSignal =
  | "ATTEMPT_COUNT"
  | "CLASSIFICATION_RULE"
  | "ERROR_CODE"
  | "ERROR_REASON"
  | "ERROR_SOURCE"
  | "ERROR_STEP"
  | "PAYMENT_METHOD";

export interface DiagnosisEvidence {
  explanation: string;
  signal: DiagnosisEvidenceSignal;
  value: string;
}

export interface DiagnosisInput {
  attemptCount: number;
  errorCode?: string | null;
  errorReason?: string | null;
  errorSource?: string | null;
  errorStep?: string | null;
  method: PaymentMethod;
}

export interface DiagnosisResult {
  category: FailureCategory;
  customerContactAllowed: boolean;
  diagnosis: string;
  evidence: DiagnosisEvidence[];
  recommendedAction: ActionType;
  recoverabilityBand: RecoverabilityBand;
  recoverabilityScore: number;
}
