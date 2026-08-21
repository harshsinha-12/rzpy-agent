import type { FastifyInstance } from "fastify";

import { createSimulatorController } from "./controller.js";
import type { SimulatorService } from "./types.js";

export async function registerSimulatorRoutes(
  app: FastifyInstance,
  service: SimulatorService,
): Promise<void> {
  const controller = createSimulatorController(service);
  app.post("/simulator/run", controller.run);
}
