import { getApi } from "@/lib/api-client";

import type { RecoveryQuery } from "./query";
import {
  recoveryCaseDetailResponseSchema,
  recoveryCasesResponseSchema,
  type RecoveryCaseDetail,
  type RecoveryCasesResponse,
} from "./schemas";

export async function fetchRecoveryCases(
  query: RecoveryQuery,
): Promise<RecoveryCasesResponse> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  return getApi(
    `/recovery/cases?${params.toString()}`,
    recoveryCasesResponseSchema,
  );
}

export async function fetchRecoveryCase(
  caseId: string,
): Promise<RecoveryCaseDetail> {
  const response = await getApi(
    `/recovery/cases/${encodeURIComponent(caseId)}`,
    recoveryCaseDetailResponseSchema,
  );
  return response.data;
}
