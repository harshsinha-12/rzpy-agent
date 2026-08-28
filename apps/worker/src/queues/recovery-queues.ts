import { Queue, type ConnectionOptions } from "bullmq";
import {
  analysisJobId,
  analyseRecoveryJobName,
  executeJobId,
  executeRecoveryJobName,
  paymentEventJobId,
  paymentEventsQueueName,
  processPaymentEventJobName,
  reconcileRecoveryJobName,
  recoveryActionsQueueName,
  recoveryAnalysisQueueName,
  recoveryReconciliationEveryMs,
  recoveryReconciliationQueueName,
  recoveryVerificationQueueName,
  verifyJobId,
  verifyRecoveryJobName,
  type PaymentEventJobData,
  type RecoveryActionJobData,
  type RecoveryAnalysisJobData,
  type RecoveryReconciliationJobData,
  type RecoveryVerificationJobData,
} from "@recoveryos/domain";

import { defaultRecoveryJobOptions, delayUntil } from "./job-options.js";

export interface RecoveryJobQueues {
  close(): Promise<void>;
  enqueueAnalysis(data: RecoveryAnalysisJobData): Promise<void>;
  enqueueExecute(
    data: RecoveryActionJobData,
    scheduledFor?: Date | null,
  ): Promise<void>;
  enqueuePaymentEvent(data: PaymentEventJobData): Promise<void>;
  enqueueVerify(
    data: RecoveryVerificationJobData,
    scheduledFor?: Date | null,
  ): Promise<void>;
  scheduleReconciliation(merchantSlug: string): Promise<void>;
}

export function createRecoveryJobQueues(
  connection: ConnectionOptions,
): RecoveryJobQueues {
  const paymentEvents = new Queue<PaymentEventJobData>(paymentEventsQueueName, {
    connection,
  });
  const analysis = new Queue<RecoveryAnalysisJobData>(
    recoveryAnalysisQueueName,
    { connection },
  );
  const actions = new Queue<RecoveryActionJobData>(recoveryActionsQueueName, {
    connection,
  });
  const verification = new Queue<RecoveryVerificationJobData>(
    recoveryVerificationQueueName,
    { connection },
  );
  const reconciliation = new Queue<RecoveryReconciliationJobData>(
    recoveryReconciliationQueueName,
    { connection },
  );

  return {
    async close() {
      await Promise.all([
        paymentEvents.close(),
        analysis.close(),
        actions.close(),
        verification.close(),
        reconciliation.close(),
      ]);
    },

    enqueueAnalysis: async (data) => {
      await analysis.add(analyseRecoveryJobName, data, {
        ...defaultRecoveryJobOptions(),
        jobId: analysisJobId(data.caseId),
      });
    },

    enqueueExecute: async (data, scheduledFor) => {
      await actions.add(executeRecoveryJobName, data, {
        ...defaultRecoveryJobOptions({
          delay: delayUntil(scheduledFor ?? null),
        }),
        jobId: executeJobId(data.actionId),
      });
    },

    enqueuePaymentEvent: async (data) => {
      await paymentEvents.add(processPaymentEventJobName, data, {
        ...defaultRecoveryJobOptions(),
        jobId: paymentEventJobId(data.webhookEventId),
      });
    },

    enqueueVerify: async (data, scheduledFor) => {
      await verification.add(verifyRecoveryJobName, data, {
        ...defaultRecoveryJobOptions({
          delay: delayUntil(scheduledFor ?? null),
        }),
        jobId: verifyJobId(data.actionId),
      });
    },

    scheduleReconciliation: async (merchantSlug) => {
      await reconciliation.upsertJobScheduler(
        reconcileRecoveryJobName,
        { every: recoveryReconciliationEveryMs },
        {
          data: { merchantSlug },
          name: reconcileRecoveryJobName,
          opts: defaultRecoveryJobOptions({ attempts: 1 }),
        },
      );
    },
  };
}
