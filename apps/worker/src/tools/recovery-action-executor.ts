import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@recoveryos/database";
import type { RecoveryActionExecutor } from "@recoveryos/recovery-engine";
import { UnrecoverableError } from "bullmq";

import type { RecoveryExecutionTools } from "./recovery-tools.js";

function jsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function createRecoveryActionExecutor(
  prisma: PrismaClient,
  tools: RecoveryExecutionTools,
): RecoveryActionExecutor {
  return {
    async execute(input) {
      const action = await prisma.recoveryAction.findUnique({
        include: { recoveryCase: { include: { paymentEvent: true } } },
        where: { id: input.actionId },
      });
      if (!action || action.caseId !== input.caseId) {
        throw new UnrecoverableError(
          `Recovery action ${input.actionId} was not found for its case.`,
        );
      }

      const payment = action.recoveryCase.paymentEvent;
      const rechecked = await tools.recheckPayment({
        currentAmountPaise: payment.amountPaise,
        currentStatus: payment.status,
        dataSource: action.dataSource,
        paymentId: payment.razorpayPaymentId,
      });
      if (rechecked.status === "CAPTURED") {
        const now = new Date();
        await prisma.$transaction(async (tx) => {
          await tx.paymentEvent.update({
            data: {
              eventType: "payment.captured.api_recheck",
              status: "CAPTURED",
            },
            where: { id: payment.id },
          });
          await tx.recoveryCase.update({
            data: {
              closedAt: now,
              lastUpdatedAt: now,
              recoveredAmountPaise: rechecked.amountPaise,
              status: "RECOVERED",
            },
            where: { id: action.caseId },
          });
          await tx.auditEvent.create({
            data: {
              actionId: action.id,
              actor: "EXECUTION_LAYER",
              caseId: action.caseId,
              dataSource: action.dataSource,
              decision: "SKIP",
              eventType: "action.skipped.payment_captured",
              id: randomUUID(),
              input: jsonValue({ paymentId: payment.razorpayPaymentId }),
              occurredAt: now,
              output: jsonValue({ paymentStatus: rechecked.status }),
              reasoning:
                "Payment status was re-checked immediately before execution.",
            },
          });
        });
        return {
          output: { paymentStatus: "CAPTURED", toolCalled: false },
          razorpayReference: action.razorpayReference,
          result: "SKIPPED",
        };
      }

      const output = await tools.execute({
        actionId: action.id,
        actionType: action.actionType,
        amountPaise: action.recoveryCase.amountAtRiskPaise,
        casePublicId: action.recoveryCase.publicId,
        currency: action.recoveryCase.currency,
        dataSource: action.dataSource,
      });
      return {
        output: output.value,
        razorpayReference: output.razorpayReference,
        result: "SUCCEEDED",
      };
    },
  };
}
