import { getApi } from "@/lib/api-client";

import {
  analyticsOverviewResponseSchema,
  type AnalyticsOverview,
} from "./schemas";

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await getApi(
    "/analytics/overview",
    analyticsOverviewResponseSchema,
  );
  return response.data;
}
