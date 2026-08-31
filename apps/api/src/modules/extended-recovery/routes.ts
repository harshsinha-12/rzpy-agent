import type { FastifyInstance } from "fastify";
import type { ExtendedRecoveryService } from "./types.js";

export async function registerExtendedRecoveryRoutes(
  app: FastifyInstance,
  service: ExtendedRecoveryService,
) {
  app.get("/extended-recovery", async (_request, reply) =>
    reply.code(200).send(await service.list()),
  );
  app.post<{ Params: { id: string } }>(
    "/extended-recovery/:id/voice",
    async (request, reply) =>
      reply.code(200).send(await service.generateVoice(request.params.id)),
  );
  app.get<{ Params: { id: string } }>(
    "/extended-recovery/:id/voice",
    async (request, reply) => {
      const voice = await service.getVoice(request.params.id);
      if (!voice) return reply.code(404).send({ error: "VOICE_NOT_FOUND" });
      return reply.type(voice.mime).send(Buffer.from(voice.audio));
    },
  );
}
