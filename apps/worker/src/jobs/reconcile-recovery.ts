import type { PrismaClient } from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";

import type { RecoveryJobQueues } from "../queues/recovery-queues.js";

const STALE_AFTER_MS = 30_000;

export async function reconcileRecoveryJobs(
  prisma: PrismaClient,
  queues: Pick<
    RecoveryJobQueues,
    "enqueueAnalysis" | "enqueueExecute" | "enqueuePaymentEvent"
  >,
  merchantSlug = DEMO_MERCHANT_SLUG,
): Promise<{
  analyses: number;
  executions: number;
  paymentEvents: number;
}> {
  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
  const merchant = await prisma.merchant.findUnique({
    select: { id: true },
    where: { slug: merchantSlug },
  });

  if (!merchant) {
    return { analyses: 0, executions: 0, paymentEvents: 0 };
  }

  const queuedWebhooks = await prisma.webhookEvent.findMany({
    select: { id: true },
    where: {
      merchantId: merchant.id,
      processingStatus: "QUEUED",
      receivedAt: { lte: staleBefore },
    },
    take: 50,
  });
  for (const webhook of queuedWebhooks) {
    await queues.enqueuePaymentEvent({ webhookEventId: webhook.id });
  }

  const overdueActions = await prisma.recoveryAction.findMany({
    select: { id: true },
    take: 50,
    where: {
      policyDecision: "APPROVED",
      recoveryCase: { merchantId: merchant.id },
      result: { in: ["PENDING", "RETRYING"] },
      scheduledFor: { lte: new Date() },
    },
  });
  for (const action of overdueActions) {
    await queues.enqueueExecute({ actionId: action.id });
  }

  const waitingCases = await prisma.recoveryCase.findMany({
    select: { id: true },
    take: 50,
    where: {
      merchantId: merchant.id,
      status: { in: ["ACTION_REQUIRED", "DIAGNOSING"] },
      actions: { none: {} },
    },
  });
  for (const recoveryCase of waitingCases) {
    await queues.enqueueAnalysis({ caseId: recoveryCase.id });
  }

  return {
    analyses: waitingCases.length,
    executions: overdueActions.length,
    paymentEvents: queuedWebhooks.length,
  };
}
