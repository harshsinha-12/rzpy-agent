import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import type { CheckoutDropOffService } from "./types.js";

const paramsSchema = z
  .object({ id: z.string().trim().min(1).max(100) })
  .strict();

export function createCheckoutDropOffController(
  service: CheckoutDropOffService,
) {
  return {
    async createDraft(request: FastifyRequest, reply: FastifyReply) {
      const { id } = paramsSchema.parse(request.params);
      return reply.code(200).send(await service.createDraft(id));
    },
    async list(_request: FastifyRequest, reply: FastifyReply) {
      return reply.code(200).send(await service.list());
    },
  };
}
