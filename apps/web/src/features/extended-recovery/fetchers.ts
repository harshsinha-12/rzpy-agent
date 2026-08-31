import { getApi } from "@/lib/api-client";
import { extendedRecoveryResponseSchema } from "./schemas";

export function fetchExtendedRecoveryCases() {
  return getApi("/extended-recovery", extendedRecoveryResponseSchema);
}
