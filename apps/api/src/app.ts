import { createPrismaClient, type PrismaClient } from "@recoveryos/database";
import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import { registerErrorHandlers } from "./lib/error-handler.js";
import { createAnalyticsRepository } from "./modules/analytics/repository.js";
import { registerAnalyticsRoutes } from "./modules/analytics/routes.js";
import { createAnalyticsService } from "./modules/analytics/service.js";
import type { AnalyticsService } from "./modules/analytics/types.js";
import { registerHealthRoutes } from "./modules/health/routes.js";
import {
  createRuntimeHealthService,
  type HealthService,
} from "./modules/health/service.js";
import { createRecoveryCaseRepository } from "./modules/recoveries/repository.js";
import { registerRecoveryCaseRoutes } from "./modules/recoveries/routes.js";
import { createRecoveryCaseService } from "./modules/recoveries/service.js";
import type { RecoveryCaseService } from "./modules/recoveries/types.js";

interface BuildAppOptions {
  analyticsService?: AnalyticsService;
  database?: PrismaClient;
  healthService?: HealthService;
  logger?: boolean;
  recoveryCaseService?: RecoveryCaseService;
}

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true });
  const healthService =
    options.healthService ??
    createRuntimeHealthService({
      databaseUrl: env.DATABASE_URL,
      redisUrl: env.REDIS_URL,
    });
  const needsDatabase =
    !options.analyticsService || !options.recoveryCaseService;
  const database = needsDatabase
    ? (options.database ?? createPrismaClient(env.DATABASE_URL))
    : null;
  const ownsDatabase = database !== null && !options.database;
  const analyticsService =
    options.analyticsService ??
    createAnalyticsService(createAnalyticsRepository(database!));
  const recoveryCaseService =
    options.recoveryCaseService ??
    createRecoveryCaseService(createRecoveryCaseRepository(database!));

  app.addHook("onClose", async () => {
    await Promise.all([
      healthService.close(),
      ownsDatabase ? database!.$disconnect() : Promise.resolve(),
    ]);
  });

  registerErrorHandlers(app);
  await registerHealthRoutes(app, healthService);
  await registerRecoveryCaseRoutes(app, recoveryCaseService);
  await registerAnalyticsRoutes(app, analyticsService);

  return app;
}
