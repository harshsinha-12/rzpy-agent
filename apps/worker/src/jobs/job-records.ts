import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@recoveryos/database";
import type { DataSource } from "@recoveryos/domain";

export type RecoveryJobRecordStatus =
  "ACTIVE" | "COMPLETED" | "EXHAUSTED" | "FAILED" | "QUEUED";

function jsonValue(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function recordRecoveryJob(
  prisma: PrismaClient,
  input: {
    actionId?: string | null;
    attemptCount: number;
    bullJobId: string;
    caseId?: string | null;
    dataSource: DataSource;
    jobName: string;
    lastError?: string | null;
    maxAttempts: number;
    payload: Record<string, unknown>;
    queueName: string;
    scheduledFor?: Date | null;
    status: RecoveryJobRecordStatus;
  },
): Promise<void> {
  const now = new Date();
  const completed =
    input.status === "COMPLETED" || input.status === "EXHAUSTED";

  await prisma.recoveryJob.upsert({
    create: {
      actionId: input.actionId ?? null,
      attemptCount: input.attemptCount,
      bullJobId: input.bullJobId,
      caseId: input.caseId ?? null,
      completedAt: completed ? now : null,
      createdAt: now,
      dataSource: input.dataSource,
      id: randomUUID(),
      jobName: input.jobName,
      lastError: input.lastError ?? null,
      maxAttempts: input.maxAttempts,
      payload: jsonValue(input.payload),
      queueName: input.queueName,
      scheduledFor: input.scheduledFor ?? null,
      status: input.status,
      updatedAt: now,
    },
    update: {
      actionId: input.actionId ?? null,
      attemptCount: input.attemptCount,
      caseId: input.caseId ?? null,
      lastError: input.lastError ?? null,
      status: input.status,
      updatedAt: now,
      ...(completed ? { completedAt: now } : {}),
    },
    where: {
      queueName_bullJobId: {
        bullJobId: input.bullJobId,
        queueName: input.queueName,
      },
    },
  });
}
