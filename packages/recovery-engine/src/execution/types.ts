import type { ActionResult, ActionType } from "@recoveryos/domain";

export class TransientRecoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransientRecoveryError";
  }
}

export interface RecoveryActionExecutionInput {
  actionId: string;
  actionType: ActionType;
  attemptNumber: number;
  caseId: string;
  idempotencyKey: string;
}

export interface RecoveryActionExecutionResult {
  output?: Record<string, unknown>;
  razorpayReference?: string | null;
  result: Extract<
    ActionResult,
    "FAILED" | "RETRYING" | "SKIPPED" | "SUCCEEDED"
  >;
}

export interface RecoveryActionExecutor {
  execute(
    input: RecoveryActionExecutionInput,
  ): Promise<RecoveryActionExecutionResult>;
}
