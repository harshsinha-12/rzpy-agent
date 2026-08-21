import type { RecoveryAgent } from "@recoveryos/agents";
import type { PrismaClient } from "@recoveryos/database";

import { analyseRecoveryCase } from "./analyse-recovery.js";

export async function processAnalysisJob(
  prisma: PrismaClient,
  caseId: string,
  agent: RecoveryAgent,
  enqueueExecute: (
    actionId: string,
    scheduledFor?: Date | null,
  ) => Promise<void>,
): Promise<void> {
  const result = await analyseRecoveryCase(prisma, caseId, agent);

  if (result.decision === "APPROVED" && result.actionId) {
    await enqueueExecute(result.actionId, result.scheduledFor);
  }
}
