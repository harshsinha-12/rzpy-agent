import { getApi } from "@/lib/api-client";
import { checkoutDropOffsResponseSchema } from "./schemas";

export function fetchCheckoutDropOffs() {
  return getApi("/checkout/drop-offs", checkoutDropOffsResponseSchema);
}
