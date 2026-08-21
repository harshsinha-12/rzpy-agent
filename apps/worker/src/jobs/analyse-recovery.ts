import { randomUUID } from "node:crypto";

import type { RecoveryAgent } from "@recoveryos/agents";
import type { Prisma, PrismaClient } from "@recoveryos/database";
import type { ActionType, RecoveryCaseStatus } from "@recoveryos/domain";
import { validateRecoveryAction } from "@recoveryos/recovery-engine";

import { readDiagnosisOutput } from "../agents/recovery-context.js";

function jsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function statusForAction(action: ActionType): RecoveryCaseStatus {
  if (action === "WAIT") return "WAITING";
  if (action === "ESCALATE") return "ESCALATED";
  if (action === "STOP") return "STOPPED";
  return "ACTION_REQUIRED";
}

export async function analyseRecoveryCase(
  prisma: PrismaClient,
  caseId: string,
  agent: RecoveryAgent,
): Promise<void> {
  const agentRun = await agent.propose(caseId);
  const now = new Date();
  const recoveryCase = await prisma.recoveryCase.findUnique({
    include: {
      actions: { orderBy: { createdAt: "asc" } },
      auditEvents: {
        orderBy: { occurredAt: "desc" },
        select: { output: true },
        where: {
          actor: "DIAGNOSIS_ENGINE",
          eventType: "diagnosis.completed",
        },
      },
      customer: true,
      merchant: { include: { recoveryPolicy: true } },
      paymentEvent: true,
    },
    where: { id: caseId },
  });

  if (!recoveryCase) {
    throw new Error(`Recovery case ${caseId} was not found.`);
  }
  const policy = recoveryCase.merchant.recoveryPolicy;
  if (!policy) {
    throw new Error("The recovery case merchant has no recovery policy.");
  }

  const idempotencyKey = `recovery:${recoveryCase.paymentEvent.razorpayPaymentId}:proposal:1`;
  if (
    recoveryCase.actions.some(
      (action) => action.idempotencyKey === idempotencyKey,
    )
  ) {
    return;
  }

  const diagnosisOutput = readDiagnosisOutput(recoveryCase.auditEvents);
  const approvedActions = recoveryCase.actions.filter(
    (action) => action.policyDecision === "APPROVED",
  );
  const lastApprovedAction = approvedActions.at(-1);
  const messagesSince = new Date(now.getTime() - 24 * 3_600_000);
  const proposal = agentRun.proposal;
  const policyResult = validateRecoveryAction({
    facts: {
      approvedActionCount: approvedActions.length,
      caseOpenedAt: recoveryCase.openedAt,
      customerContactAllowed: diagnosisOutput?.customerContactAllowed ?? false,
      customerOptedOut: recoveryCase.customer.optedOut,
      duplicateActionInFlight: recoveryCase.actions.some(
        (action) =>
          action.actionType === proposal.action &&
          ["PENDING", "RETRYING"].includes(action.result),
      ),
      failureCategory: recoveryCase.failureCategory,
      lastApprovedActionAt: lastApprovedAction?.createdAt ?? null,
      messagesSentLast24Hours: recoveryCase.actions.filter(
        (action) =>
          action.actionType === "SEND_REMINDER" &&
          action.policyDecision === "APPROVED" &&
          action.createdAt >= messagesSince,
      ).length,
      now,
      paymentStatus: recoveryCase.paymentEvent.status,
    },
    policy: {
      allowedActions: policy.allowedActions,
      maxAttemptsPerCase: policy.maxAttemptsPerCase,
      maxMessagesPerDay: policy.maxMessagesPerDay,
      minimumRetryDelayMinutes: policy.minimumRetryDelayMinutes,
      recoveryWindowHours: policy.recoveryWindowHours,
    },
    proposal,
  });
  const actionId = randomUUID();
  const attemptNumber = recoveryCase.actions.length + 1;
  const effectiveAction =
    policyResult.decision === "APPROVED"
      ? proposal.action
      : (policyResult.safeFallbackAction ?? "WAIT");
  const nextStatus = policyResult.violations.some(
    ({ code }) => code === "ACTION_LIMIT_REACHED",
  )
    ? "EXHAUSTED"
    : statusForAction(effectiveAction);
  const proposalAt = now;
  const policyAt = new Date(now.getTime() + 1);

  await prisma.$transaction(async (tx) => {
    const existingAction = await tx.recoveryAction.findUnique({
      where: { idempotencyKey },
    });
    if (existingAction) return;

    await tx.recoveryAction.create({
      data: {
        actionType: proposal.action,
        attemptNumber,
        caseId,
        confidence: proposal.confidence,
        createdAt: proposalAt,
        dataSource: recoveryCase.dataSource,
        id: actionId,
        idempotencyKey,
        input: jsonValue({
          diagnosis: proposal.diagnosis,
          evidence: proposal.evidence,
          fallbackReason: agentRun.fallbackReason,
          model: agentRun.model,
          source: agentRun.source,
        }),
        output: jsonValue({
          safeFallbackAction: policyResult.safeFallbackAction,
          violations: policyResult.violations,
        }),
        policyDecision: policyResult.decision,
        policyReason: policyResult.policyReason,
        proposedBy: "RECOVERY_AGENT",
        reason: proposal.reason,
        result: policyResult.decision === "APPROVED" ? "PENDING" : "SKIPPED",
        scheduledFor: policyResult.scheduledFor,
      },
    });

    await tx.auditEvent.create({
      data: {
        actor: "RECOVERY_AGENT",
        caseId,
        dataSource: recoveryCase.dataSource,
        decision: proposal.action,
        eventType:
          agentRun.source === "OPENAI"
            ? "agent.proposal.created"
            : "agent.proposal.fallback",
        id: randomUUID(),
        input: jsonValue({ caseId: recoveryCase.publicId }),
        occurredAt: proposalAt,
        output: jsonValue({
          confidence: proposal.confidence,
          delayMinutes: proposal.delayMinutes,
          evidence: proposal.evidence,
          fallbackReason: agentRun.fallbackReason,
          model: agentRun.model,
          source: agentRun.source,
        }),
        reasoning: proposal.reason,
      },
    });

    await tx.auditEvent.create({
      data: {
        actionId,
        actor: "POLICY_ENGINE",
        caseId,
        dataSource: recoveryCase.dataSource,
        decision: policyResult.decision,
        eventType:
          policyResult.decision === "APPROVED"
            ? "policy.approved"
            : "policy.denied",
        id: randomUUID(),
        input: jsonValue({ proposedAction: proposal.action }),
        occurredAt: policyAt,
        output: jsonValue({
          effectiveAction,
          safeFallbackAction: policyResult.safeFallbackAction,
          scheduledFor: policyResult.scheduledFor?.toISOString() ?? null,
          violations: policyResult.violations,
        }),
        reasoning: policyResult.policyReason,
      },
    });

    await tx.recoveryCase.update({
      data: { lastUpdatedAt: policyAt, status: nextStatus },
      where: { id: caseId },
    });
  });
}
