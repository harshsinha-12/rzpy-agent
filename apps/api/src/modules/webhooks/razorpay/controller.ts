import type { FastifyReply, FastifyRequest } from "fastify";

import { badRequestError } from "../../../lib/errors.js";
import type { RazorpayWebhookService } from "./types.js";

export function createRazorpayWebhookController(
  service: RazorpayWebhookService,
) {
  return {
    async ingest(request: FastifyRequest, reply: FastifyReply) {
      if (typeof request.body !== "string") {
        throw badRequestError(
          "INVALID_WEBHOOK_PAYLOAD",
          "The Razorpay webhook body must be the original JSON text.",
        );
      }

      const signatureHeader = request.headers["x-razorpay-signature"];
      const eventIdHeader = request.headers["x-razorpay-event-id"];
      const result = await service.ingest({
        eventIdHeader: Array.isArray(eventIdHeader)
          ? eventIdHeader[0]
          : eventIdHeader,
        rawBody: request.body,
        signature: Array.isArray(signatureHeader)
          ? signatureHeader[0]
          : signatureHeader,
      });

      return reply.code(200).send({
        data: {
          duplicate: result.duplicate,
          received: true,
        },
      });
    },
  };
}
