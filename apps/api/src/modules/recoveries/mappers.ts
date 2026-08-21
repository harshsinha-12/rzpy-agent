import type {
  RecoveryActionRecord,
  RecoveryCaseDetailRecord,
  RecoveryCaseListRecord,
} from "./types.js";

function mapAction(action: RecoveryActionRecord) {
  return {
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
