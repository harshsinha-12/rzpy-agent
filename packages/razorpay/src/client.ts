import {
  razorpayClientConfigSchema,
  type RazorpayClientConfig,
} from "./config.js";
import { createRazorpayRequest, type RazorpayHttp } from "./http.js";
import {
  ensurePaymentLink,
  fetchPaymentLink,
  findPaymentLinkByReference,
  type CreatePaymentLinkInput,
  type EnsurePaymentLinkResult,
  type RazorpayPaymentLink,
} from "./payment-links.js";
import { fetchPayment } from "./payments.js";
import {
  createOrder,
  type CreateRazorpayOrderInput,
  type RazorpayOrder,
} from "./orders.js";
import type { RazorpayPaymentEntity } from "./schemas.js";

export interface RazorpayClient {
  createOrder(input: CreateRazorpayOrderInput): Promise<RazorpayOrder>;
  ensurePaymentLink(
    input: CreatePaymentLinkInput,
  ): Promise<EnsurePaymentLinkResult>;
  fetchPayment(paymentId: string): Promise<RazorpayPaymentEntity>;
  fetchPaymentLink(paymentLinkId: string): Promise<RazorpayPaymentLink>;
  findPaymentLinkByReference(
    referenceId: string,
  ): Promise<RazorpayPaymentLink | null>;
}

export function createRazorpayClient(
  config: RazorpayClientConfig,
  http: RazorpayHttp = { fetch },
): RazorpayClient {
  const parsed = razorpayClientConfigSchema.parse(config);
  const authorization = `Basic ${Buffer.from(`${parsed.keyId}:${parsed.keySecret}`).toString("base64")}`;
  const request = createRazorpayRequest(authorization, http);

  return {
    createOrder: (input) => createOrder(request, input),
    ensurePaymentLink: (input) => ensurePaymentLink(request, input),
    fetchPayment: (paymentId) => fetchPayment(request, paymentId),
    fetchPaymentLink: (paymentLinkId) =>
      fetchPaymentLink(request, paymentLinkId),
    findPaymentLinkByReference: (referenceId) =>
      findPaymentLinkByReference(request, referenceId),
  };
}

export type {
  CreatePaymentLinkInput,
  CreateRazorpayOrderInput,
  EnsurePaymentLinkResult,
  RazorpayOrder,
  RazorpayPaymentLink,
};
