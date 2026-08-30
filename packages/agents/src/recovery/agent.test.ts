import { describe, expect, it, vi } from "vitest";

import { createRecoveryAgent } from "./agent.js";
import type { RecoveryAgentContext, RecoveryAgentModel } from "./types.js";

const context: RecoveryAgentContext = {
  caseId: "RC-TEST-1",
  customer: { contactAllowed: true, optedOut: false },
  diagnosis: {
    category: "GATEWAY_TRANSIENT",
    evidence: ["Error source: gateway", "Failed attempts: 1"],
    fallbackAction: "WAIT",
    recoverabilityScore: 86,
    summary: "A transient gateway failure is likely recoverable.",
  },
  history: { failedAttemptsForOrder: 1, previousActions: [] },
  payment: {
    amountPaise: 499_900,
    currency: "INR",
    errorReason: "gateway_timeout",
    errorSource: "gateway",
    errorStep: "payment_processing",
    method: "UPI",
    status: "FAILED",
  },
  policy: {
    allowedActions: [
      "WAIT",
      "CREATE_PAYMENT_LINK",
      "SEND_REMINDER",
      "ALTERNATIVE_METHOD",
      "ESCALATE",
      "STOP",
    ],
    maxAttemptsPerCase: 3,
    maxMessagesPerDay: 2,
    minimumRetryDelayMinutes: 3,
    recoveryWindowHours: 48,
  },
};

function tools() {
  return { loadContext: vi.fn().mockResolvedValue(context) };
}

describe("createRecoveryAgent", () => {
  it("accepts a structured model proposal", async () => {
    const model: RecoveryAgentModel = {
      generate: vi.fn().mockResolvedValue({
        action: "CREATE_PAYMENT_LINK",
        confidence: 82,
        delayMinutes: 5,
        diagnosis: "The gateway failure is likely transient.",
        evidence: ["Error source is gateway"],
        reason: "Wait through the cooldown, then offer a fresh payment path.",
      }),
      model: "gpt-5.6-terra",
    };

    const result = await createRecoveryAgent({ model, tools: tools() }).propose(
      context.caseId,
    );

    expect(result).toMatchObject({
      fallbackReason: null,
      model: "gpt-5.6-terra",
      proposal: { action: "CREATE_PAYMENT_LINK", delayMinutes: 5 },
      source: "OPENAI",
    });
    expect(model.generate).toHaveBeenCalledWith(context);
  });

  it.each([
    ["missing model", undefined, "MODEL_UNAVAILABLE"],
    [
      "model failure",
      {
        generate: vi.fn().mockRejectedValue(new Error("provider unavailable")),
        model: "gpt-5.6-terra",
      },
      "MODEL_UNAVAILABLE",
    ],
    [
      "invalid response",
      {
        generate: vi.fn().mockResolvedValue({ action: "RETRY_FOREVER" }),
        model: "gpt-5.6-terra",
      },
      "INVALID_RESPONSE",
    ],
  ])("uses the deterministic fallback for %s", async (_, model, reason) => {
    const typedModel = model as RecoveryAgentModel | undefined;
    const result = await createRecoveryAgent({
      ...(typedModel ? { model: typedModel } : {}),
      tools: tools(),
    }).propose(context.caseId);

    expect(result).toMatchObject({
      fallbackReason: reason,
      model: null,
      proposal: {
        action: "WAIT",
        confidence: 86,
        delayMinutes: 3,
      },
      source: "DETERMINISTIC_FALLBACK",
    });
  });

  it("rejects invalid context before calling the model", async () => {
    const model: RecoveryAgentModel = {
      generate: vi.fn(),
      model: "gpt-5.6-terra",
    };
    const agent = createRecoveryAgent({
      model,
      tools: { loadContext: vi.fn().mockResolvedValue({ caseId: "invalid" }) },
    });

    await expect(agent.propose("invalid")).rejects.toThrow(
      "Recovery agent context failed validation.",
    );
    expect(model.generate).not.toHaveBeenCalled();
  });

  it("keeps a non-terminal deterministic fallback inside the merchant delay", async () => {
    const result = await createRecoveryAgent({
      tools: {
        loadContext: vi.fn().mockResolvedValue({
          ...context,
          diagnosis: {
            ...context.diagnosis,
            category: "CUSTOMER_AUTH",
            fallbackAction: "CREATE_PAYMENT_LINK",
          },
        }),
      },
    }).propose(context.caseId);

    expect(result.proposal).toMatchObject({
      action: "CREATE_PAYMENT_LINK",
      delayMinutes: 3,
    });
  });
});
