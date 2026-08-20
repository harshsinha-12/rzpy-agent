import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import { registerHealthRoutes } from "./modules/health/routes.js";
import {
  createRuntimeHealthService,
  type HealthService,
} from "./modules/health/service.js";

interface BuildAppOptions {
  healthService?: HealthService;
  logger?: boolean;
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

  app.addHook("onClose", async () => {
    await healthService.close();
  });

  await registerHealthRoutes(app, healthService);

  return app;
}
