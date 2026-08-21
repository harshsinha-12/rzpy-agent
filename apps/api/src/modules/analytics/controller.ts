import type { FastifyReply, FastifyRequest } from "fastify";

import type { AnalyticsService } from "./types.js";

export function createAnalyticsController(service: AnalyticsService) {
  return {
    async getOverview(_request: FastifyRequest, reply: FastifyReply) {
      return reply.code(200).send(await service.getOverview());
    },
  };
}
