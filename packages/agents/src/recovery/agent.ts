import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { buildRecoveryPrompt, RECOVERY_AGENT_INSTRUCTIONS } from "./prompt.js";
import {
  recoveryAgentContextSchema,
  recoveryAgentProposalSchema,
} from "./schemas.js";
import type {
  RecoveryAgent,
  RecoveryAgentContext,
  RecoveryAgentModel,
  RecoveryAgentProposal,
  RecoveryAgentRun,
  RecoveryAgentTools,
} from "./types.js";

export const DEFAULT_OPENAI_MODEL = "gpt-5.6-terra";

interface CreateRecoveryAgentOptions {
  model?: RecoveryAgentModel;
  tools: RecoveryAgentTools;
}

interface CreateOpenAIRecoveryAgentOptions {
  apiKey: string;
  model?: string;
  tools: RecoveryAgentTools;
}

function fallbackProposal(
  context: RecoveryAgentContext,
): RecoveryAgentProposal {
  const isTerminal = ["ESCALATE", "STOP"].includes(
    context.diagnosis.fallbackAction,
  );

  return {
    action: context.diagnosis.fallbackAction,
    confidence: context.diagnosis.recoverabilityScore,
    delayMinutes: isTerminal ? 0 : context.policy.minimumRetryDelayMinutes,
    diagnosis: context.diagnosis.summary,
    evidence:
      context.diagnosis.evidence.length > 0
        ? context.diagnosis.evidence.slice(0, 6)
        : [`Deterministic category: ${context.diagnosis.category}`],
    reason:
      "The model proposal was unavailable, so RecoveryOS used the deterministic diagnosis fallback.",
  };
}

function fallbackRun(
  context: RecoveryAgentContext,
  reason: RecoveryAgentRun["fallbackReason"],
): RecoveryAgentRun {
  return {
    fallbackReason: reason,
    model: null,
    proposal: fallbackProposal(context),
    source: "DETERMINISTIC_FALLBACK",
  };
}

export function createRecoveryAgent({
  model,
  tools,
}: CreateRecoveryAgentOptions): RecoveryAgent {
  return {
    async propose(caseId) {
      const contextResult = recoveryAgentContextSchema.safeParse(
        await tools.loadContext(caseId),
      );
      if (!contextResult.success) {
        throw new Error("Recovery agent context failed validation.");
      }

      if (!model) {
        return fallbackRun(contextResult.data, "MODEL_UNAVAILABLE");
      }

      let output: unknown;
      try {
        output = await model.generate(contextResult.data);
      } catch {
        return fallbackRun(contextResult.data, "MODEL_UNAVAILABLE");
      }

      const proposal = recoveryAgentProposalSchema.safeParse(output);
      if (!proposal.success) {
        return fallbackRun(contextResult.data, "INVALID_RESPONSE");
      }

      return {
        fallbackReason: null,
        model: model.model,
        proposal: proposal.data,
        source: "OPENAI",
      };
    },
  };
}

function createOpenAIModel(apiKey: string, model: string): RecoveryAgentModel {
  const client = new OpenAI({
    apiKey,
    maxRetries: 1,
    timeout: 12_000,
  });

  return {
    async generate(context) {
      const response = await client.responses.parse({
        input: buildRecoveryPrompt(context),
        instructions: RECOVERY_AGENT_INSTRUCTIONS,
        max_output_tokens: 700,
        model,
        reasoning: { effort: "low" },
        store: false,
        text: {
          format: zodTextFormat(
            recoveryAgentProposalSchema,
            "recovery_action_proposal",
          ),
        },
      });

      if (!response.output_parsed) {
        throw new Error("OpenAI returned no structured recovery proposal.");
      }

      return response.output_parsed;
    },
    model,
  };
}

export function createOpenAIRecoveryAgent({
  apiKey,
  model = DEFAULT_OPENAI_MODEL,
  tools,
}: CreateOpenAIRecoveryAgentOptions): RecoveryAgent {
  return createRecoveryAgent({
    model: createOpenAIModel(apiKey, model),
    tools,
  });
}
