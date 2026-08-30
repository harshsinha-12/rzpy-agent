import type { ActionType, FailureCategory } from "@recoveryos/domain";

interface CategoryProfile {
  baseScore: number;
  customerContactAllowed: boolean;
  diagnosis: string;
  minimumScore: number;
  repeatPenalty: number;
  recommendedAction: ActionType;
}

export const categoryProfiles: Record<FailureCategory, CategoryProfile> = {
  CUSTOMER_AUTH: {
    baseScore: 78,
    customerContactAllowed: true,
    diagnosis:
      "Customer authentication failed. A fresh, contextual payment attempt is more useful than repeated automatic retries.",
    minimumScore: 30,
    repeatPenalty: 12,
    recommendedAction: "CREATE_PAYMENT_LINK",
  },
  GATEWAY_TRANSIENT: {
    baseScore: 86,
    customerContactAllowed: false,
    diagnosis:
      "The payment failed in gateway infrastructure and is likely transient. Allow a cooldown before creating another payment opportunity.",
    minimumScore: 40,
    repeatPenalty: 12,
    recommendedAction: "WAIT",
  },
  INSUFFICIENT_FUNDS: {
    baseScore: 58,
    customerContactAllowed: true,
    diagnosis:
      "The account did not have sufficient funds. An immediate retry has low value, so recovery should wait for a later opportunity.",
    minimumScore: 25,
    repeatPenalty: 10,
    recommendedAction: "WAIT",
  },
  ISSUER_FAILURE: {
    baseScore: 42,
    customerContactAllowed: true,
    diagnosis:
      "The issuer or bank declined the payment. Wait before offering a different payment route if the failure persists.",
    minimumScore: 15,
    repeatPenalty: 8,
    recommendedAction: "WAIT",
  },
  MERCHANT_ERROR: {
    baseScore: 0,
    customerContactAllowed: false,
    diagnosis:
      "A merchant integration or configuration error caused the failure. Customer recovery must stop while the merchant fixes the issue.",
    minimumScore: 0,
    repeatPenalty: 0,
    recommendedAction: "ESCALATE",
  },
  NETWORK_ERROR: {
    baseScore: 82,
    customerContactAllowed: false,
    diagnosis:
      "A network transport failure interrupted the payment. Allow a short cooldown before another payment attempt.",
    minimumScore: 40,
    repeatPenalty: 12,
    recommendedAction: "WAIT",
  },
  UNKNOWN: {
    baseScore: 30,
    customerContactAllowed: false,
    diagnosis:
      "The available Razorpay signals do not identify a safe recovery cause. Avoid customer contact until the failure is understood.",
    minimumScore: 0,
    repeatPenalty: 15,
    recommendedAction: "WAIT",
  },
};

export const signalTokens = {
  authentication: [
    "authentication_failed",
    "incorrect_otp",
    "invalid_otp",
    "otp_incorrect",
    "three_ds_authentication_failed",
    "upi_pin_incorrect",
  ],
  gateway: [
    "gateway_error",
    "gateway_timeout",
    "internal_error",
    "internal_server_error",
    "service_unavailable",
    "temporarily_unavailable",
  ],
  insufficientFunds: [
    "balance_insufficient",
    "insufficient_balance",
    "insufficient_funds",
    "low_balance",
  ],
  issuer: [
    "bank_declined",
    "card_declined",
    "issuer_declined",
    "issuer_down",
    "issuer_unavailable",
    "transaction_declined",
  ],
  merchant: [
    "incorrect_api_key",
    "integration_error",
    "invalid_api_key",
    "merchant_not_configured",
    "payment_method_disabled",
  ],
  network: [
    "connection_error",
    "connection_reset",
    "dns_error",
    "network_error",
    "network_timeout",
    "request_timeout",
  ],
} as const;
