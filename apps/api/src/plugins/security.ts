import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

import { AppError } from "../lib/errors.js";

export interface SecurityPluginOptions {
  rateLimitMax: number;
}

export async function registerSecurityPlugins(
  app: FastifyInstance,
  options: SecurityPluginOptions,
): Promise<void> {
  await app.register(helmet, {
    global: true,
  });
  await app.register(rateLimit, {
    allowList: (request) => request.url.split("?")[0] === "/health",
    errorResponseBuilder: (_request, context) =>
      new AppError(
        context.statusCode,
        "RATE_LIMIT_EXCEEDED",
        `Rate limit exceeded. Retry after ${Math.ceil(context.ttl / 1000)} seconds.`,
      ),
    global: true,
    max: options.rateLimitMax,
    timeWindow: "1 minute",
  });
}
