import type { FastifyInstance } from "fastify";

import { createRazorpayWebhookController } from "./controller.js";
import type { RazorpayWebhookService } from "./types.js";

export async function registerRazorpayWebhookRoutes(
  app: FastifyInstance,
  service: RazorpayWebhookService,
): Promise<void> {
  const controller = createRazorpayWebhookController(service);

  await app.register(async (scope) => {
    scope.addContentTypeParser(
      "application/json",
      { parseAs: "string" },
      (_request, body, done) => {
        done(null, body);
      },
    );

    scope.post("/webhooks/razorpay", controller.ingest);
  });
}
