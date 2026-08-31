import type {
  ExtendedRecoveryRepository,
  ExtendedRecoveryService,
} from "./types.js";

export function createExtendedRecoveryService(
  repository: ExtendedRecoveryRepository,
): ExtendedRecoveryService {
  return {
    async list() {
      const records = await repository.list();
      return {
        data: records.map((record) => ({
          ...record,
          dueAt: record.dueAt?.toISOString() ?? null,
        })),
      };
    },
  };
}
