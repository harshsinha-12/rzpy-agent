import { actionTypes, type ActionType } from "@recoveryos/domain";

import type {
  RecoveryActionRecord,
  RecoveryCaseDetailRecord,
  RecoveryCaseListRecord,
} from "./types.js";

interface DiagnosisEvidenceItem {
  explanation: string;
  signal:
    | "ATTEMPT_COUNT"
    | "CLASSIFICATION_RULE"
    | "ERROR_CODE"
    | "ERROR_REASON"
    | "ERROR_SOURCE"
    | "ERROR_STEP"
    | "PAYMENT_METHOD";
  value: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isActionType(value: unknown): value is ActionType {
  return (
    typeof value === "string" &&
    (actionTypes as readonly string[]).includes(value)
  );
}

function isPolicyViolation(
  value: unknown,
): value is { code: string; message: string } {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  );
}

function razorpayPaymentLinkUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "rzp.io"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function actionMetadata(action: RecoveryActionRecord) {
  const input = isRecord(action.input) ? action.input : undefined;
  const output = isRecord(action.output) ? action.output : undefined;
  const evidence = Array.isArray(input?.evidence)
    ? input.evidence.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const policyViolations = Array.isArray(output?.violations)
    ? output.violations.filter(isPolicyViolation)
    : [];

  return {
    paymentLinkShortUrl: razorpayPaymentLinkUrl(output?.shortUrl),
    paymentLinkStatus:
      typeof output?.paymentLinkStatus === "string"
        ? output.paymentLinkStatus
        : typeof output?.status === "string"
          ? output.status
          : null,
    policyViolations,
    proposalEvidence: evidence,
    proposalModel: typeof input?.model === "string" ? input.model : null,
    proposalSource:
      input?.source === "OPENAI" || input?.source === "DETERMINISTIC_FALLBACK"
        ? input.source
        : null,
    safeFallbackAction: isActionType(output?.safeFallbackAction)
      ? output.safeFallbackAction
      : null,
  };
}

function isDiagnosisEvidence(value: unknown): value is DiagnosisEvidenceItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.explanation === "string" &&
    typeof value.signal === "string" &&
    [
      "ATTEMPT_COUNT",
      "CLASSIFICATION_RULE",
      "ERROR_CODE",
      "ERROR_REASON",
      "ERROR_SOURCE",
      "ERROR_STEP",
      "PAYMENT_METHOD",
    ].includes(value.signal) &&
    typeof value.value === "string"
  );
}

function fallbackEvidence(
  record: RecoveryCaseDetailRecord,
): DiagnosisEvidenceItem[] {
  const values = [
    [
      "ERROR_SOURCE",
      record.paymentEvent.errorSource,
      "Razorpay failure origin",
    ],
    ["ERROR_STEP", record.paymentEvent.errorStep, "Payment-flow step"],
    [
      "ERROR_REASON",
      record.paymentEvent.errorReason,
      "Normalized failure reason",
    ],
    ["ERROR_CODE", record.paymentEvent.errorCode, "Provider error code"],
    [
      "PAYMENT_METHOD",
      record.paymentEvent.paymentMethod,
      "Normalized payment method",
    ],
  ] as const;

  return values.flatMap(([signal, value, explanation]) =>
    value ? [{ explanation, signal, value }] : [],
  );
}

function diagnosisMetadata(record: RecoveryCaseDetailRecord) {
  const diagnosisEvent = [...record.auditEvents]
    .reverse()
    .find(
      (event) =>
        event.actor === "DIAGNOSIS_ENGINE" &&
        event.eventType === "diagnosis.completed",
    );
  const output = isRecord(diagnosisEvent?.output)
    ? diagnosisEvent.output
    : undefined;
  const evidence = Array.isArray(output?.evidence)
    ? output.evidence.filter(isDiagnosisEvidence)
    : [];

  return {
    customerContactAllowed:
      typeof output?.customerContactAllowed === "boolean"
        ? output.customerContactAllowed
        : null,
    diagnosisEvidence:
      evidence.length > 0 ? evidence : fallbackEvidence(record),
    recommendedAction: isActionType(output?.recommendedAction)
      ? output.recommendedAction
      : null,
  };
}

function mapAction(action: RecoveryActionRecord) {
  return {
    ...actionMetadata(action),
    actionType: action.actionType,
    attemptNumber: action.attemptNumber,
    confidence: action.confidence,
    createdAt: action.createdAt.toISOString(),
    dataSource: action.dataSource,
    executedAt: action.executedAt?.toISOString() ?? null,
    id: action.id,
    input: action.input,
    output: action.output,
    policyDecision: action.policyDecision,
    policyReason: action.policyReason,
    proposedBy: action.proposedBy,
    razorpayReference: action.razorpayReference,
    reason: action.reason,
    result: action.result,
    scheduledFor: action.scheduledFor?.toISOString() ?? null,
  };
}

export function mapRecoveryCaseListItem(record: RecoveryCaseListRecord) {
  const proposedAction = record.actions[0];

  return {
    amountAtRiskPaise: record.amountAtRiskPaise,
    caseId: record.publicId,
    currency: record.currency,
    dataSource: record.dataSource,
    diagnosis: record.diagnosis,
    failureCategory: record.failureCategory,
    failureDescription: record.paymentEvent.errorDescription,
    failureReason: record.paymentEvent.errorReason,
    failureSource: record.paymentEvent.errorSource,
    lastUpdatedAt: record.lastUpdatedAt.toISOString(),
    openedAt: record.openedAt.toISOString(),
    orderId: record.paymentEvent.razorpayOrderId,
    paymentId: record.paymentEvent.razorpayPaymentId,
    paymentMethod: record.paymentEvent.paymentMethod,
    paymentStatus: record.paymentEvent.status,
    policyDecision: proposedAction?.policyDecision ?? null,
    proposedAction: proposedAction?.actionType ?? null,
    recoverabilityBand: record.recoverabilityBand,
    recoverabilityScore: record.recoverabilityScore,
    recoveredAmountPaise: record.recoveredAmountPaise,
    recoveryStatus: record.status,
  };
}

export function mapRecoveryCaseDetail(record: RecoveryCaseDetailRecord) {
  return {
    ...mapRecoveryCaseListItem(record),
    ...diagnosisMetadata(record),
    actions: record.actions.map(mapAction),
    auditTimeline: record.auditEvents.map((event) => ({
      actionId: event.actionId,
      actor: event.actor,
      dataSource: event.dataSource,
      decision: event.decision,
      eventType: event.eventType,
      id: event.id,
      input: event.input,
      occurredAt: event.occurredAt.toISOString(),
      output: event.output,
      reasoning: event.reasoning,
    })),
    closedAt: record.closedAt?.toISOString() ?? null,
    customer: record.customer,
    payment: {
      amountPaise: record.paymentEvent.amountPaise,
      currency: record.paymentEvent.currency,
      errorCode: record.paymentEvent.errorCode,
      errorDescription: record.paymentEvent.errorDescription,
      errorReason: record.paymentEvent.errorReason,
      errorSource: record.paymentEvent.errorSource,
      errorStep: record.paymentEvent.errorStep,
      eventType: record.paymentEvent.eventType,
      method: record.paymentEvent.paymentMethod,
      occurredAt: record.paymentEvent.occurredAt.toISOString(),
      orderId: record.paymentEvent.razorpayOrderId,
      paymentId: record.paymentEvent.razorpayPaymentId,
      status: record.paymentEvent.status,
    },
  };
}
