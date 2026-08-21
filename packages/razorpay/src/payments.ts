import type { RazorpayRequest } from "./http.js";
import { razorpayPaymentEntitySchema } from "./schemas.js";

export async function fetchPayment(
  request: RazorpayRequest,
  paymentId: string,
) {
  return razorpayPaymentEntitySchema.parse(
    await request.request(`/v1/payments/${encodeURIComponent(paymentId)}`),
  );
}
