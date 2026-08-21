import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@recoveryos/database";
import { UnrecoverableError } from "bullmq";

import type { RecoveryExecutionTools } from "../tools/recovery-tools.js";
import { verifyRecoveryOutcome } from "./recovery-outcome.js";

export interface VerifyRecoveryDependencies {
  enqueueAnalysis?: (caseId: string) => Promise<void>;
  recoveryTools?: RecoveryExecutionTools;
}

function jsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function verifyRecoveryAction(
  prisma: PrismaClient,
  actionId: string,
  dependencies: VerifyRecoveryDependencies = {},
): Promise<{ status: string }> {
  const action = await prisma.recoveryAction.findUnique({
    include: {
      recoveryCase: { include: { paymentEvent: true } },
    },
    where: { id: actionId },
  });

  if (!action) {
    throw new UnrecoverableError(`Recovery action ${actionId} was not found.`);
  }

  if (
    action.actionType === "CREATE_PAYMENT_LINK" &&
    action.razorpayReference &&
    dependencies.recoveryTools
  ) {
    const verification = await verifyRecoveryOutcome(
      prisma,
      action.id,
      dependencies.recoveryTools,
    );
    return {
      status: verification.recovered ? "RECOVERED" : action.recoveryCase.status,
    };
  }

  const now = new Date();
  const paymentStatus = action.recoveryCase.paymentEvent.status;

  if (paymentStatus === "CAPTURED") {
    await prisma.$transaction(async (tx) => {
      await tx.recoveryCase.update({
        data: {
          closedAt: now,
          lastUpdatedAt: now,
          recoveredAmountPaise: action.recoveryCase.amountAtRiskPaise,
          status: "RECOVERED",
        },
        where: { id: action.caseId },
      });
      await tx.auditEvent.create({
        data: {
          actionId: action.id,
          actor: "SYSTEM",
          caseId: action.caseId,
          dataSource: action.dataSource,
          decision: "RECOVERED",
          eventType: "recovery.verified",
          id: randomUUID(),
          occurredAt: now,
          output: jsonValue({ paymentStatus }),
          reasoning: "Verification found the payment already captured.",
        },
      });
    });
    return { status: "RECOVERED" };
  }

  await prisma.auditEvent.create({
    data: {
      actionId: action.id,
      actor: "SYSTEM",
      caseId: action.caseId,
      dataSource: action.dataSource,
      decision: paymentStatus,
      eventType: "recovery.verified",
      id: randomUUID(),
      occurredAt: now,
      output: jsonValue({ paymentStatus }),
      reasoning: "Verification found the payment still unrecovered.",
    },
  });

  if (
    (action.recoveryCase.status === "ACTION_REQUIRED" ||
      action.recoveryCase.status === "DIAGNOSING") &&
    dependencies.enqueueAnalysis
  ) {
    await dependencies.enqueueAnalysis(action.caseId);
  }

  return { status: action.recoveryCase.status };
}
