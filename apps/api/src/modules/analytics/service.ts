import { calculateAnalyticsOverview } from "./calculations.js";
import type { AnalyticsRepository, AnalyticsService } from "./types.js";

export function createAnalyticsService(
  repository: AnalyticsRepository,
): AnalyticsService {
  return {
    async getOverview() {
      return {
        data: calculateAnalyticsOverview(await repository.getOverviewRecords()),
      };
    },
  };
}
