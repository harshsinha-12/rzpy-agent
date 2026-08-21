import type { PaymentMethod, PaymentStatus } from "@recoveryos/domain";

export function mapRazorpayMethod(
  method: string | null | undefined,
): PaymentMethod {
  switch (method?.toLowerCase()) {
    case "upi":
      return "UPI";
    case "card":
      return "CARD";
    case "netbanking":
      return "NETBANKING";
    case "wallet":
      return "WALLET";
    default:
      return "UNKNOWN";
  }
}

export function mapRazorpayPaymentStatus(status: string): PaymentStatus {
  switch (status.toLowerCase()) {
    case "failed":
      return "FAILED";
    case "authorized":
      return "AUTHORIZED";
    case "captured":
      return "CAPTURED";
    case "created":
      return "CREATED";
    default:
      return "FAILED";
  }
}

export function nullableText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
