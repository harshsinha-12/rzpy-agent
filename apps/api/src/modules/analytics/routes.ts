import type { FastifyInstance } from "fastify";

import { createAnalyticsController } from "./controller.js";
import type { AnalyticsService } from "./types.js";

export async function registerAnalyticsRoutes(
  app: FastifyInstance,
  service: AnalyticsService,
): Promise<void> {
  const controller = createAnalyticsController(service);
  app.get("/analytics/overview", controller.getOverview);
}
