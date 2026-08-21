import type { JobsOptions } from "bullmq";
import { recoveryJobAttempts, recoveryJobBackoffMs } from "@recoveryos/domain";

export function defaultRecoveryJobOptions(
  overrides: JobsOptions = {},
): JobsOptions {
  return {
    attempts: recoveryJobAttempts,
    backoff: {
      delay: recoveryJobBackoffMs,
      type: "exponential",
    },
    removeOnComplete: 200,
    removeOnFail: false,
    ...overrides,
  };
}

export function delayUntil(
  scheduledFor: Date | null,
  now = new Date(),
): number {
  if (!scheduledFor) {
    return 0;
  }
  return Math.max(0, scheduledFor.getTime() - now.getTime());
}
