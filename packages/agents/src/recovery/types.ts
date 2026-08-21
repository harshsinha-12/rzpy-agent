import type { z } from "zod";

import type {
  recoveryAgentContextSchema,
  recoveryAgentProposalSchema,
} from "./schemas.js";

export type RecoveryAgentContext = z.infer<typeof recoveryAgentContextSchema>;
export type RecoveryAgentProposal = z.infer<typeof recoveryAgentProposalSchema>;

export type RecoveryAgentRunSource = "DETERMINISTIC_FALLBACK" | "OPENAI";

export interface RecoveryAgentRun {
  fallbackReason: "INVALID_RESPONSE" | "MODEL_UNAVAILABLE" | null;
  model: string | null;
  proposal: RecoveryAgentProposal;
  source: RecoveryAgentRunSource;
}

export interface RecoveryAgent {
  propose(caseId: string): Promise<RecoveryAgentRun>;
}

export interface RecoveryAgentTools {
  loadContext(caseId: string): Promise<unknown>;
}

export interface RecoveryAgentModel {
  generate(context: RecoveryAgentContext): Promise<unknown>;
  model: string;
}
