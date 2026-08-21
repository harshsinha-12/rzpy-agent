export const paymentEventsQueueName = "payment-events";
export const recoveryAnalysisQueueName = "recovery-analysis";
export const recoveryActionsQueueName = "recovery-actions";
export const recoveryVerificationQueueName = "recovery-verification";
export const recoveryReconciliationQueueName = "recovery-reconciliation";

export const recoveryJobAttempts = 5;
export const recoveryJobBackoffMs = 2_000;
export const recoveryReconciliationEveryMs = 60_000;

export const processPaymentEventJobName = "process-payment-event";
export const analyseRecoveryJobName = "analyse-recovery";
export const executeRecoveryJobName = "execute-recovery";
export const verifyRecoveryJobName = "verify-recovery";
export const reconcileRecoveryJobName = "reconcile-recovery";

export interface PaymentEventJobData {
  webhookEventId: string;
}

export interface RecoveryAnalysisJobData {
  caseId: string;
}

export interface RecoveryActionJobData {
  actionId: string;
}

export interface RecoveryVerificationJobData {
  actionId: string;
}

export interface RecoveryReconciliationJobData {
  merchantSlug: string;
}

export function analysisJobId(caseId: string): string {
  return `analyse:${caseId}`;
}

export function executeJobId(actionId: string): string {
  return `execute:${actionId}`;
}

export function verifyJobId(actionId: string): string {
  return `verify:${actionId}`;
}

export function paymentEventJobId(webhookEventId: string): string {
  return webhookEventId;
}
