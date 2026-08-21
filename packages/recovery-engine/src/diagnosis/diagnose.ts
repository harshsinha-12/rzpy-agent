import type { FailureCategory, RecoverabilityBand } from "@recoveryos/domain";

import { categoryProfiles, signalTokens } from "./constants.js";
import type {
  DiagnosisEvidence,
  DiagnosisInput,
  DiagnosisResult,
} from "./types.js";

function normalizeSignal(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "_")
    .replaceAll(/^_+|_+$/g, "");
}

function containsToken(value: string, tokens: readonly string[]): boolean {
  return tokens.some((token) => value === token || value.includes(token));
}

function classify(input: {
  errorCode: string;
  errorReason: string;
  errorSource: string;
  errorStep: string;
}): FailureCategory {
  const { errorCode, errorReason, errorSource, errorStep } = input;

  if (
    ["business", "merchant"].includes(errorSource) ||
    containsToken(errorReason, signalTokens.merchant)
  ) {
    return "MERCHANT_ERROR";
  }

  if (containsToken(errorReason, signalTokens.insufficientFunds)) {
    return "INSUFFICIENT_FUNDS";
  }

  if (
    containsToken(errorReason, signalTokens.authentication) ||
    (errorSource === "customer" && errorStep.includes("authentication"))
  ) {
    return "CUSTOMER_AUTH";
  }

  if (errorSource === "network") {
    return "NETWORK_ERROR";
  }

  if (["gateway", "razorpay"].includes(errorSource)) {
    return "GATEWAY_TRANSIENT";
  }

  if (["bank", "issuer"].includes(errorSource)) {
    return "ISSUER_FAILURE";
  }

  if (containsToken(errorReason, signalTokens.network)) return "NETWORK_ERROR";

  if (
    containsToken(errorReason, signalTokens.gateway) ||
    containsToken(errorCode, signalTokens.gateway)
  ) {
    return "GATEWAY_TRANSIENT";
  }

  if (containsToken(errorReason, signalTokens.issuer)) return "ISSUER_FAILURE";

  return "UNKNOWN";
}

function recoverabilityBand(score: number): RecoverabilityBand {
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MEDIUM";
  if (score > 0) return "LOW";
  return "NONE";
}

function evidenceFor(
  input: DiagnosisInput,
  normalized: {
    errorCode: string;
    errorReason: string;
    errorSource: string;
    errorStep: string;
  },
  category: FailureCategory,
  attemptCount: number,
): DiagnosisEvidence[] {
  const evidence: DiagnosisEvidence[] = [];
  const observedSignals = [
    ["ERROR_SOURCE", normalized.errorSource, "Razorpay failure origin"],
    ["ERROR_STEP", normalized.errorStep, "Payment-flow step"],
    ["ERROR_REASON", normalized.errorReason, "Normalized failure reason"],
    ["ERROR_CODE", normalized.errorCode, "Provider error code"],
  ] as const;

  for (const [signal, value, explanation] of observedSignals) {
    if (value) {
      evidence.push({ explanation, signal, value });
    }
  }

  evidence.push({
    explanation: "Normalized payment method",
    signal: "PAYMENT_METHOD",
    value: input.method,
  });
  evidence.push({
    explanation: "Failed attempts observed for this order",
    signal: "ATTEMPT_COUNT",
    value: String(attemptCount),
  });
  evidence.push({
    explanation: "Deterministic category selected from the observed signals",
    signal: "CLASSIFICATION_RULE",
    value: category,
  });

  return evidence;
}

export function diagnosePaymentFailure(input: DiagnosisInput): DiagnosisResult {
  const attemptCount = Math.max(1, Math.trunc(input.attemptCount));
  const normalized = {
    errorCode: normalizeSignal(input.errorCode),
    errorReason: normalizeSignal(input.errorReason),
    errorSource: normalizeSignal(input.errorSource),
    errorStep: normalizeSignal(input.errorStep),
  };
  const category = classify(normalized);
  const profile = categoryProfiles[category];
  const recoverabilityScore = Math.max(
    profile.minimumScore,
    profile.baseScore - profile.repeatPenalty * (attemptCount - 1),
  );
  const recommendedAction =
    category === "UNKNOWN" && attemptCount > 1
      ? "ESCALATE"
      : profile.recommendedAction;

  return {
    category,
    customerContactAllowed: profile.customerContactAllowed,
    diagnosis: profile.diagnosis,
    evidence: evidenceFor(input, normalized, category, attemptCount),
    recommendedAction,
    recoverabilityBand: recoverabilityBand(recoverabilityScore),
    recoverabilityScore,
  };
}
