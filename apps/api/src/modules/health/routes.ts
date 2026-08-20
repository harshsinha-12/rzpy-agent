import type { FastifyInstance } from "fastify";

import type { HealthService } from "./service.js";

export async function registerHealthRoutes(
  app: FastifyInstance,
  healthService: HealthService,
): Promise<void> {
  app.get("/health", async (_request, reply) => {
    const snapshot = await healthService.getSnapshot();

    return reply.code(snapshot.status === "healthy" ? 200 : 503).send(snapshot);
  });
}
