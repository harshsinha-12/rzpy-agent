import type { FastifyReply, FastifyRequest } from "fastify";

import { badRequestError } from "../../lib/errors.js";
import { runSimulationBodySchema } from "./schemas.js";
import type { SimulatorService } from "./types.js";

export function createSimulatorController(service: SimulatorService) {
  return {
    async run(request: FastifyRequest, reply: FastifyReply) {
      const parsed = runSimulationBodySchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        throw badRequestError(
          "INVALID_SIMULATION_CONFIGURATION",
          "Simulation requires an integer paymentCount from 250 to 500 and a safe integer seed.",
        );
      }
      const configuration: {
        paymentCount?: number;
        seed?: number;
      } = {};
      if (parsed.data.paymentCount !== undefined) {
        configuration.paymentCount = parsed.data.paymentCount;
      }
      if (parsed.data.seed !== undefined) {
        configuration.seed = parsed.data.seed;
      }
      return reply.code(201).send(await service.run(configuration));
    },
  };
}
