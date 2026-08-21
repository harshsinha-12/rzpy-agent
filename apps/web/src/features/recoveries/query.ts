import {
  dataSources,
  failureCategories,
  paymentMethods,
  recoveryCaseStatuses,
} from "@recoveryos/domain";
import { z } from "zod";

export type RawSearchParams = Record<string, string | string[] | undefined>;

const querySchema = z.object({
  dataSource: z.enum(dataSources).optional(),
  errorSource: z.string().trim().min(1).max(50).optional(),
  failureCategory: z.enum(failureCategories).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  paymentMethod: z.enum(paymentMethods).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  sortBy: z
    .enum(["amountAtRiskPaise", "lastUpdatedAt"])
    .default("lastUpdatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(recoveryCaseStatuses).optional(),
});

export type RecoveryQuery = z.infer<typeof querySchema>;

function firstValue(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.trim() ? first : undefined;
}

export function parseRecoveryQuery(
  searchParams: RawSearchParams,
): RecoveryQuery {
  const candidate = Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      firstValue(value),
    ]),
  );
  const parsed = querySchema.safeParse(candidate);

  return parsed.success
    ? parsed.data
    : {
        page: 1,
        pageSize: 10,
        sortBy: "lastUpdatedAt",
        sortOrder: "desc",
      };
}

export function toRecoverySearchParams(
  query: RecoveryQuery,
  patch: Partial<RecoveryQuery> = {},
): URLSearchParams {
  const nextQuery = { ...query, ...patch };
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(nextQuery)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  return params;
}

export function recoveryHref(
  query: RecoveryQuery,
  patch: Partial<RecoveryQuery>,
): string {
  return `/recoveries?${toRecoverySearchParams(query, patch).toString()}`;
}
