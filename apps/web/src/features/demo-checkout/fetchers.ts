import { getApi } from "@/lib/api-client";

import { checkoutStatusSchema, type CheckoutStatus } from "./schemas";

export async function fetchCheckoutStatus(): Promise<CheckoutStatus> {
  const response = await getApi(
    "/demo/razorpay/checkout",
    checkoutStatusSchema,
  );
  return response.data;
}
