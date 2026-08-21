import type { RecoveryAgent } from "@recoveryos/agents";
import type { PrismaClient } from "@recoveryos/database";
import {
  DEMO_MERCHANT_SLUG,
  paymentEventsQueueName,
  recoveryActionsQueueName,
  recoveryAnalysisQueueName,
  recoveryReconciliationQueueName,
  recoveryVerificationQueueName,
  type PaymentEventJobData,
  type RecoveryActionJobData,
  type RecoveryAnalysisJobData,
  type RecoveryReconciliationJobData,
  type RecoveryVerificationJobData,
} from "@recoveryos/domain";
import type { RecoveryActionExecutor } from "@recoveryos/recovery-engine";
import { Worker, type ConnectionOptions } from "bullmq";

import { processAnalysisJob } from "../jobs/process-analysis-job.js";
import { processPaymentEvent } from "../jobs/process-payment-event.js";
import { executeRecoveryAction } from "../jobs/execute-recovery.js";
import { reconcileRecoveryJobs } from "../jobs/reconcile-recovery.js";
import { runTrackedRecoveryJob } from "../jobs/track-job.js";
import { verifyRecoveryAction } from "../jobs/verify-recovery.js";
import { defaultRecoveryJobOptions } from "./job-options.js";
import type { RecoveryJobQueues } from "./recovery-queues.js";
import type { RecoveryExecutionTools } from "../tools/recovery-tools.js";

export function createRecoveryWorkers(options: {
  connection: ConnectionOptions;
  prisma: PrismaClient;
  queues: RecoveryJobQueues;
  recoveryAgent: RecoveryAgent;
  recoveryTools?: RecoveryExecutionTools;
  toolExecutor?: RecoveryActionExecutor;
}): Worker[] {
  const {
    connection,
    prisma,
    queues,
    recoveryAgent,
    recoveryTools,
    toolExecutor,
  } = options;
  const workerOptions = {
    connection,
    defaultJobOptions: defaultRecoveryJobOptions(),
  };

  const paymentWorker = new Worker<PaymentEventJobData>(
    paymentEventsQueueName,
    async (job) =>
      runTrackedRecoveryJob(
        prisma,
        job,
        { payload: { webhookEventId: job.data.webhookEventId } },
        () =>
          processPaymentEvent(prisma, job.data.webhookEventId, {
            enqueueAnalysis: (caseId) => queues.enqueueAnalysis({ caseId }),
          }),
      ),
    workerOptions,
  );

  const analysisWorker = new Worker<RecoveryAnalysisJobData>(
    recoveryAnalysisQueueName,
    async (job) =>
      runTrackedRecoveryJob(
        prisma,
        job,
        { caseId: job.data.caseId, payload: { caseId: job.data.caseId } },
        () =>
          processAnalysisJob(
            prisma,
            job.data.caseId,
            recoveryAgent,
            (actionId, scheduledFor) =>
              queues.enqueueExecute({ actionId }, scheduledFor),
          ),
      ),
    workerOptions,
  );

  const actionWorker = new Worker<RecoveryActionJobData>(
    recoveryActionsQueueName,
    async (job) =>
      runTrackedRecoveryJob(
        prisma,
        job,
        {
          actionId: job.data.actionId,
          payload: { actionId: job.data.actionId },
        },
        () =>
          executeRecoveryAction(prisma, job.data.actionId, {
            enqueueVerify: (actionId, scheduledFor) =>
              queues.enqueueVerify({ actionId }, scheduledFor),
            ...(toolExecutor ? { toolExecutor } : {}),
          }),
      ),
    workerOptions,
  );

  const verificationWorker = new Worker<RecoveryVerificationJobData>(
    recoveryVerificationQueueName,
    async (job) =>
      runTrackedRecoveryJob(
        prisma,
        job,
        {
          actionId: job.data.actionId,
          payload: { actionId: job.data.actionId },
        },
        () =>
          verifyRecoveryAction(prisma, job.data.actionId, {
            enqueueAnalysis: (caseId) => queues.enqueueAnalysis({ caseId }),
            ...(recoveryTools ? { recoveryTools } : {}),
          }),
      ),
    workerOptions,
  );

  const reconciliationWorker = new Worker<RecoveryReconciliationJobData>(
    recoveryReconciliationQueueName,
    async (job) =>
      runTrackedRecoveryJob(
        prisma,
        job,
        { payload: { merchantSlug: job.data.merchantSlug } },
        () =>
          reconcileRecoveryJobs(
            prisma,
            queues,
            job.data.merchantSlug ?? DEMO_MERCHANT_SLUG,
          ),
      ),
    workerOptions,
  );

  return [
    paymentWorker,
    analysisWorker,
    actionWorker,
    verificationWorker,
    reconciliationWorker,
  ];
}
