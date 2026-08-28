import { checkoutOrderSchema, type CheckoutOrder } from "./schemas";

export async function createDemoCheckoutOrder(): Promise<CheckoutOrder> {
  const response = await fetch("/api/demo/razorpay/orders", {
    method: "POST",
  });
  const body: unknown = await response.json();
  const parsed = checkoutOrderSchema.safeParse(body);

  if (!response.ok || !parsed.success) {
    throw new Error(
      "Could not create a Razorpay Test Mode order. Check API health and Test Mode keys.",
    );
  }

  return parsed.data.data;
}
