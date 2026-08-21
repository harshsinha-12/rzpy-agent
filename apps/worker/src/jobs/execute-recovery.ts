import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@recoveryos/database";
import type { ActionType } from "@recoveryos/domain";
import {
  TransientRecoveryError,
  type RecoveryActionExecutor,
} from "@recoveryos/recovery-engine";
import { UnrecoverableError } from "bullmq";

export interface ExecuteRecoveryDependencies {
  enqueueVerify?: (
    actionId: string,
    scheduledFor?: Date | null,
  ) => Promise<void>;
  toolExecutor?: RecoveryActionExecutor;
}

export interface ExecuteRecoveryResult {
  result: string;
  skipped: boolean;
}

function jsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function record(value: Prisma.JsonValue | null): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isOrchestratedAction(actionType: ActionType): boolean {
  return (
    actionType === "WAIT" || actionType === "STOP" || actionType === "ESCALATE"
  );
}

export async function executeRecoveryAction(
  prisma: PrismaClient,
  actionId: string,
  dependencies: ExecuteRecoveryDependencies = {},
): Promise<ExecuteRecoveryResult> {
  const action = await prisma.recoveryAction.findUnique({
    include: { recoveryCase: true },
    where: { id: actionId },
  });

  if (!action) {
    throw new UnrecoverableError(`Recovery action ${actionId} was not found.`);
  }

  if (action.policyDecision !== "APPROVED") {
    return { result: action.result, skipped: true };
  }

  if (action.result === "SUCCEEDED" || action.result === "SKIPPED") {
    return { result: action.result, skipped: true };
  }

  const now = new Date();
  await prisma.recoveryAction.update({
    data: { result: "RETRYING" },
    where: { id: action.id },
  });
  await prisma.recoveryCase.update({
    data: { lastUpdatedAt: now, status: "RECOVERY_RUNNING" },
    where: { id: action.caseId },
  });

  try {
    const outcome = dependencies.toolExecutor
      ? await executeToolAction(action, dependencies.toolExecutor)
      : isOrchestratedAction(action.actionType)
        ? {
            output: { handledBy: "orchestration" },
            razorpayReference: null,
            result: "SUCCEEDED" as const,
          }
        : await executeToolAction(action, undefined);

    if (outcome.result === "RETRYING") {
      throw new TransientRecoveryError(
        "The recovery execution tool requested a retry.",
      );
    }

    const closedStatus =
      outcome.result === "SKIPPED" &&
      outcome.output?.paymentStatus === "CAPTURED"
        ? "RECOVERED"
        : action.actionType === "STOP"
          ? "STOPPED"
          : action.actionType === "ESCALATE"
            ? "ESCALATED"
            : action.actionType === "WAIT"
              ? "WAITING"
              : "RECOVERY_RUNNING";

    await prisma.$transaction(async (tx) => {
      await tx.recoveryAction.update({
        data: {
          executedAt: now,
          output: jsonValue({
            ...record(action.output),
            ...(outcome.output ?? {}),
          }),
          razorpayReference:
            outcome.razorpayReference ?? action.razorpayReference,
          result: outcome.result,
        },
        where: { id: action.id },
      });
      await tx.auditEvent.create({
        data: {
          actionId: action.id,
          actor: "EXECUTION_LAYER",
          caseId: action.caseId,
          dataSource: action.dataSource,
          decision: outcome.result,
          eventType: "recovery.executed",
          id: randomUUID(),
          occurredAt: now,
          output: jsonValue({
            actionType: action.actionType,
            razorpayReference: outcome.razorpayReference ?? null,
          }),
          reasoning: `BullMQ executed ${action.actionType} for attempt ${action.attemptNumber}.`,
        },
      });
      const caseUpdate: {
        closedAt?: Date;
        lastUpdatedAt: Date;
        status:
          | "WAITING"
          | "RECOVERY_RUNNING"
          | "RECOVERED"
          | "ESCALATED"
          | "STOPPED";
      } = {
        lastUpdatedAt: now,
        status: closedStatus,
      };
      if (closedStatus === "STOPPED" || closedStatus === "ESCALATED") {
        caseUpdate.closedAt = now;
      }
      await tx.recoveryCase.update({
        data: caseUpdate,
        where: { id: action.caseId },
      });
    });

    if (outcome.result === "SUCCEEDED" && dependencies.enqueueVerify) {
      await dependencies.enqueueVerify(action.id, null);
    }

    return { result: outcome.result, skipped: false };
  } catch (error) {
    if (error instanceof TransientRecoveryError) {
      await prisma.recoveryAction.update({
        data: { result: "RETRYING" },
        where: { id: action.id },
      });
    }
    throw error;
  }
}

async function executeToolAction(
  action: {
    actionType: ActionType;
    attemptNumber: number;
    caseId: string;
    id: string;
    idempotencyKey: string;
  },
  toolExecutor: RecoveryActionExecutor | undefined,
) {
  if (!toolExecutor) {
    throw new TransientRecoveryError(
      `No recovery execution tool is attached for ${action.actionType}.`,
    );
  }

  return toolExecutor.execute({
    actionId: action.id,
    actionType: action.actionType,
    attemptNumber: action.attemptNumber,
    caseId: action.caseId,
    idempotencyKey: action.idempotencyKey,
  });
}

export async function exhaustRecoveryAction(
  prisma: PrismaClient,
  actionId: string,
  lastError: string,
): Promise<void> {
  const action = await prisma.recoveryAction.findUnique({
    where: { id: actionId },
  });
  if (!action || action.result === "SUCCEEDED") {
    return;
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.recoveryAction.update({
      data: { result: "FAILED" },
      where: { id: action.id },
    });
    await tx.recoveryCase.update({
      data: {
        closedAt: now,
        lastUpdatedAt: now,
        status: "EXHAUSTED",
      },
      where: { id: action.caseId },
    });
    await tx.auditEvent.create({
      data: {
        actionId: action.id,
        actor: "SYSTEM",
        caseId: action.caseId,
        dataSource: action.dataSource,
        decision: "EXHAUSTED",
        eventType: "job.exhausted",
        id: randomUUID(),
        occurredAt: now,
        output: jsonValue({ lastError }),
        reasoning:
          "BullMQ exhausted its bounded retry budget without a successful execution.",
      },
    });
  });
}
