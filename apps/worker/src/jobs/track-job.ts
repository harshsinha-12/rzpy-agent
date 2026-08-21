import type { Job } from "bullmq";
import type { PrismaClient } from "@recoveryos/database";
import type { DataSource } from "@recoveryos/domain";
import { recoveryJobAttempts } from "@recoveryos/domain";

import { exhaustRecoveryAction } from "./execute-recovery.js";
import { recordRecoveryJob } from "./job-records.js";

export async function runTrackedRecoveryJob<T>(
  prisma: PrismaClient,
  job: Job,
  input: {
    actionId?: string | null;
    caseId?: string | null;
    dataSource?: DataSource;
    payload: Record<string, unknown>;
  },
  run: () => Promise<T>,
): Promise<T> {
  const maxAttempts = job.opts.attempts ?? recoveryJobAttempts;
  const attemptCount = job.attemptsMade + 1;
  const actionId = input.actionId ?? null;
  const caseId = input.caseId ?? null;
  const dataSource = input.dataSource ?? "RAZORPAY_TEST_MODE";
  const scheduledFor = job.opts.delay
    ? new Date(job.timestamp + job.opts.delay)
    : null;

  await recordRecoveryJob(prisma, {
    actionId,
    attemptCount,
    bullJobId: String(job.id ?? job.name),
    caseId,
    dataSource,
    jobName: job.name,
    maxAttempts,
    payload: input.payload,
    queueName: job.queueName,
    scheduledFor,
    status: "ACTIVE",
  });

  try {
    const result = await run();
    await recordRecoveryJob(prisma, {
      actionId,
      attemptCount,
      bullJobId: String(job.id ?? job.name),
      caseId,
      dataSource,
      jobName: job.name,
      maxAttempts,
      payload: input.payload,
      queueName: job.queueName,
      status: "COMPLETED",
    });
    return result;
  } catch (error) {
    const lastError =
      error instanceof Error ? error.message : "Recovery job failed.";
    const exhausted = attemptCount >= maxAttempts;
    await recordRecoveryJob(prisma, {
      actionId,
      attemptCount,
      bullJobId: String(job.id ?? job.name),
      caseId,
      dataSource,
      jobName: job.name,
      lastError,
      maxAttempts,
      payload: input.payload,
      queueName: job.queueName,
      status: exhausted ? "EXHAUSTED" : "FAILED",
    });
    if (exhausted && actionId) {
      await exhaustRecoveryAction(prisma, actionId, lastError);
    }
    console.error(
      JSON.stringify({
        actionId,
        attemptCount,
        caseId,
        error: lastError,
        jobId: job.id,
        queue: job.queueName,
      }),
    );
    throw error;
  }
}
