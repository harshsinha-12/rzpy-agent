import type { FastifyInstance } from "fastify";
import type { ExtendedRecoveryService } from "./types.js";

export async function registerExtendedRecoveryRoutes(
  app: FastifyInstance,
  service: ExtendedRecoveryService,
) {
  app.get("/extended-recovery", async (_request, reply) =>
    reply.code(200).send(await service.list()),
  );
}
