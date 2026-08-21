import type { FastifyReply, FastifyRequest } from "fastify";

import {
  listRecoveryCasesQuerySchema,
  recoveryCaseParamsSchema,
} from "./schemas.js";
import type { RecoveryCaseService } from "./types.js";

export function createRecoveryCaseController(service: RecoveryCaseService) {
  return {
    async getById(request: FastifyRequest, reply: FastifyReply) {
      const { id } = recoveryCaseParamsSchema.parse(request.params);
      return reply.code(200).send(await service.getById(id));
    },

    async list(request: FastifyRequest, reply: FastifyReply) {
      const query = listRecoveryCasesQuerySchema.parse(request.query);
      return reply.code(200).send(await service.list(query));
    },
  };
}
