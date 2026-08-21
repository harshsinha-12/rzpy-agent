import { notFoundError } from "../../lib/errors.js";
import { mapRecoveryCaseDetail, mapRecoveryCaseListItem } from "./mappers.js";
import type { ListRecoveryCasesQuery } from "./schemas.js";
import type { RecoveryCaseRepository, RecoveryCaseService } from "./types.js";

export function createRecoveryCaseService(
  repository: RecoveryCaseRepository,
): RecoveryCaseService {
  return {
    async getById(id) {
      const record = await repository.findById(id);

      if (!record) {
        throw notFoundError(
          "RECOVERY_CASE_NOT_FOUND",
          `Recovery case ${id} was not found.`,
        );
      }

      return { data: mapRecoveryCaseDetail(record) };
    },

    async list(query: ListRecoveryCasesQuery) {
      const result = await repository.list(query);

      return {
        data: result.items.map(mapRecoveryCaseListItem),
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
          totalItems: result.totalItems,
          totalPages: Math.ceil(result.totalItems / query.pageSize),
        },
      };
    },
  };
}
