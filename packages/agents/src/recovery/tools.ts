import type { RecoveryAgentTools } from "./types.js";

export function createRecoveryAgentTools(
  loadContext: RecoveryAgentTools["loadContext"],
): RecoveryAgentTools {
  return Object.freeze({ loadContext });
}
