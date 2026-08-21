export function createFailedPaymentWebhookPayload(options: {
  amountPaise?: number;
  createdAt?: number;
  errorReason?: string;
  errorSource?: string;
  method?: string;
  orderId?: string;
  paymentId: string;
}): Record<string, unknown> {
  return {
    created_at: options.createdAt ?? 1_724_140_800,
    entity: "event",
    event: "payment.failed",
    payload: {
      payment: {
        entity: {
          amount: options.amountPaise ?? 499900,
          contact: "+919000000099",
          created_at: options.createdAt ?? 1_724_140_800,
          currency: "INR",
          email: "demo.customer@example.com",
          error_code: "GATEWAY_ERROR",
          error_description: "The payment failed in Razorpay Test Mode.",
          error_reason: options.errorReason ?? "gateway_timeout",
          error_source: options.errorSource ?? "gateway",
          error_step: "payment_processing",
          id: options.paymentId,
          method: options.method ?? "upi",
          order_id: options.orderId ?? "order_test_demo",
          status: "failed",
        },
      },
    },
  };
}
