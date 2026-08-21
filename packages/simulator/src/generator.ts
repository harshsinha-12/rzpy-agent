import type { FailureCategory, PaymentMethod } from "@recoveryos/domain";

import { createRng, pick, randomInt } from "./random.js";
import type {
  CustomerType,
  SimulationConfiguration,
  SyntheticPaymentInput,
} from "./types.js";

export type FailureProfileKey =
  | "AUTHENTICATION"
  | "CUSTOMER_ABANDONMENT"
  | "GATEWAY_NETWORK"
  | "INSUFFICIENT_BALANCE"
  | "ISSUER"
  | "MERCHANT"
  | "MISCELLANEOUS";

export interface GeneratedPayment {
  hiddenProfile: FailureProfileKey;
  input: SyntheticPaymentInput;
}

const failureDistribution: FailureProfileKey[] = [
  ...Array<FailureProfileKey>(25).fill("GATEWAY_NETWORK"),
  ...Array<FailureProfileKey>(20).fill("INSUFFICIENT_BALANCE"),
  ...Array<FailureProfileKey>(15).fill("AUTHENTICATION"),
  ...Array<FailureProfileKey>(10).fill("CUSTOMER_ABANDONMENT"),
  ...Array<FailureProfileKey>(10).fill("MERCHANT"),
  ...Array<FailureProfileKey>(10).fill("ISSUER"),
  ...Array<FailureProfileKey>(10).fill("MISCELLANEOUS"),
];

const paymentMethods: PaymentMethod[] = [
  "UPI",
  "UPI",
  "UPI",
  "CARD",
  "CARD",
  "NETBANKING",
  "WALLET",
];
const customerTypes: CustomerType[] = [
  "FIRST_TIME",
  "FIRST_TIME",
  "REPEAT",
  "REPEAT",
  "REPEAT",
  "HIGH_VALUE",
];
const amountRupees = [199, 299, 499, 799, 999, 1499, 2499, 4999, 9999, 25000];

function visibleFailure(profile: FailureProfileKey): {
  category: FailureCategory;
  reason: string;
  source: string;
} {
  switch (profile) {
    case "AUTHENTICATION":
      return {
        category: "CUSTOMER_AUTH",
        reason: "authentication_failed",
        source: "customer",
      };
    case "CUSTOMER_ABANDONMENT":
      return {
        category: "UNKNOWN",
        reason: "customer_abandoned",
        source: "customer",
      };
    case "GATEWAY_NETWORK":
      return {
        category: "GATEWAY_TRANSIENT",
        reason: "gateway_timeout",
        source: "gateway",
      };
    case "INSUFFICIENT_BALANCE":
      return {
        category: "INSUFFICIENT_FUNDS",
        reason: "insufficient_balance",
        source: "customer",
      };
    case "ISSUER":
      return {
        category: "ISSUER_FAILURE",
        reason: "issuer_unavailable",
        source: "bank",
      };
    case "MERCHANT":
      return {
        category: "MERCHANT_ERROR",
        reason: "payment_method_disabled",
        source: "business",
      };
    case "MISCELLANEOUS":
      return {
        category: "UNKNOWN",
        reason: "unclassified_failure",
        source: "unknown",
      };
  }
}

export function generateSyntheticBatch(
  configuration: SimulationConfiguration,
): GeneratedPayment[] {
  const rng = createRng(configuration.seed);
  return Array.from({ length: configuration.paymentCount }, (_, index) => {
    const hiddenProfile = pick(rng, failureDistribution);
    const failure = visibleFailure(hiddenProfile);
    const customerType = pick(rng, customerTypes);
    const baseAmount = pick(rng, amountRupees);
    const amountMultiplier = customerType === "HIGH_VALUE" ? 3 : 1;
    return {
      hiddenProfile,
      input: {
        amountPaise: baseAmount * amountMultiplier * 100,
        customerType,
        failureCategory: failure.category,
        failureReason: failure.reason,
        failureSource: failure.source,
        historicalSuccessBps: randomInt(rng, 1_500, 9_000),
        hourOfDay: randomInt(rng, 0, 23),
        id: `sim_${configuration.seed}_${String(index + 1).padStart(4, "0")}`,
        optedOut: rng() < 0.08,
        paymentMethod: pick(rng, paymentMethods),
        previousAttempts: randomInt(rng, 0, 3),
      },
    };
  });
}
