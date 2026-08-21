import type { FastifyReply, FastifyRequest } from "fastify";

import type { DemoCheckoutService } from "./types.js";

export function createDemoCheckoutController(service: DemoCheckoutService) {
  return {
    async createOrder(_request: FastifyRequest, reply: FastifyReply) {
      const order = await service.createOrder();
      return reply.code(201).send({ data: order });
    },

    async getStatus(_request: FastifyRequest, reply: FastifyReply) {
      return reply.code(200).send({ data: service.getStatus() });
    },
  };
}
