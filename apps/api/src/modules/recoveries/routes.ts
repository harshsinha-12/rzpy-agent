import type { FastifyInstance } from "fastify";

import { createRecoveryCaseController } from "./controller.js";
import type { RecoveryCaseService } from "./types.js";

export async function registerRecoveryCaseRoutes(
  app: FastifyInstance,
  service: RecoveryCaseService,
): Promise<void> {
  const controller = createRecoveryCaseController(service);

  app.get("/recovery/cases", controller.list);
  app.get("/recovery/cases/:id", controller.getById);
}
