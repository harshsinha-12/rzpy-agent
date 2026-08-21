import type { FailureProfileKey } from "./generator.js";
import type { SimulationAction, SyntheticPaymentInput } from "./types.js";

type ProbabilityTable = Record<
  FailureProfileKey,
  Record<
    | "ALTERNATIVE_METHOD"
    | "IMMEDIATE_RETRY"
    | "NO_INTERVENTION"
    | "SEND_REMINDER"
    | "WAIT",
    number
  >
>;

const hiddenRecoveryProbabilityBps: ProbabilityTable = {
  AUTHENTICATION: {
    ALTERNATIVE_METHOD: 4_800,
    IMMEDIATE_RETRY: 1_800,
    NO_INTERVENTION: 1_000,
    SEND_REMINDER: 6_500,
    WAIT: 3_000,
  },
  CUSTOMER_ABANDONMENT: {
    ALTERNATIVE_METHOD: 3_200,
    IMMEDIATE_RETRY: 1_500,
    NO_INTERVENTION: 2_500,
    SEND_REMINDER: 6_000,
    WAIT: 3_500,
  },
  GATEWAY_NETWORK: {
    ALTERNATIVE_METHOD: 5_800,
    IMMEDIATE_RETRY: 4_000,
    NO_INTERVENTION: 2_000,
    SEND_REMINDER: 3_500,
    WAIT: 7_500,
  },
  INSUFFICIENT_BALANCE: {
    ALTERNATIVE_METHOD: 6_800,
    IMMEDIATE_RETRY: 1_000,
    NO_INTERVENTION: 1_200,
    SEND_REMINDER: 5_200,
    WAIT: 4_500,
  },
  ISSUER: {
    ALTERNATIVE_METHOD: 6_500,
    IMMEDIATE_RETRY: 2_500,
    NO_INTERVENTION: 1_000,
    SEND_REMINDER: 3_000,
    WAIT: 5_000,
  },
  MERCHANT: {
    ALTERNATIVE_METHOD: 0,
    IMMEDIATE_RETRY: 0,
    NO_INTERVENTION: 0,
    SEND_REMINDER: 0,
    WAIT: 0,
  },
  MISCELLANEOUS: {
    ALTERNATIVE_METHOD: 3_000,
    IMMEDIATE_RETRY: 2_000,
    NO_INTERVENTION: 1_500,
    SEND_REMINDER: 2_800,
    WAIT: 3_800,
  },
};

function probabilityAction(action: SimulationAction) {
  if (action === "CREATE_PAYMENT_LINK") return "ALTERNATIVE_METHOD";
  if (action === "STOP" || action === "ESCALATE" || action === "NONE") {
    return "NO_INTERVENTION";
  }
  if (action === "ALTERNATIVE_METHOD") return action;
  if (action === "IMMEDIATE_RETRY") return action;
  if (action === "SEND_REMINDER") return action;
  return "WAIT";
}

export function hiddenRecoveryThresholdBps(input: {
  action: SimulationAction;
  payment: SyntheticPaymentInput;
  profile: FailureProfileKey;
}): number {
  const base =
    hiddenRecoveryProbabilityBps[input.profile][
      probabilityAction(input.action)
    ];
  const customerAdjustment =
    input.payment.customerType === "REPEAT"
      ? 450
      : input.payment.customerType === "HIGH_VALUE"
        ? -300
        : 0;
  const historyAdjustment = Math.round(
    (input.payment.historicalSuccessBps - 5_000) * 0.12,
  );
  const attemptPenalty = input.payment.previousAttempts * 250;
  return Math.max(
    0,
    Math.min(
      9_500,
      base + customerAdjustment + historyAdjustment - attemptPenalty,
    ),
  );
}
