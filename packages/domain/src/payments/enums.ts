export const dataSources = ["SIMULATED", "RAZORPAY_TEST_MODE"] as const;
export type DataSource = (typeof dataSources)[number];

export const paymentMethods = [
  "UPI",
  "CARD",
  "NETBANKING",
  "WALLET",
  "UNKNOWN",
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentStatuses = [
  "CREATED",
  "FAILED",
  "AUTHORIZED",
  "CAPTURED",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
