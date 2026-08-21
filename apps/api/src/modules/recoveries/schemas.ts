import {
  dataSources,
  failureCategories,
  paymentMethods,
  recoveryCaseStatuses,
} from "@recoveryos/domain";
import { z } from "zod";

export const listRecoveryCasesQuerySchema = z
  .object({
    dataSource: z.enum(dataSources).optional(),
    errorSource: z.string().trim().min(1).max(50).optional(),
    failureCategory: z.enum(failureCategories).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    paymentMethod: z.enum(paymentMethods).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    sortBy: z
      .enum(["amountAtRiskPaise", "lastUpdatedAt"])
      .default("lastUpdatedAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    status: z.enum(recoveryCaseStatuses).optional(),
  })
  .strict();

export const recoveryCaseParamsSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
  })
  .strict();

export type ListRecoveryCasesQuery = z.infer<
  typeof listRecoveryCasesQuerySchema
>;
