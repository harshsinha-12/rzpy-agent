import type { ActionType } from "@recoveryos/domain";

export function recoveryIdempotencyKey(input: {
  action: ActionType | "proposal";
  attempt: number;
  paymentId: string;
}): string {
  return `recovery:${input.paymentId}:${input.action}:${input.attempt}`;
}
