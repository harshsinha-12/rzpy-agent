import type { FastifyInstance } from "fastify";
import { createCheckoutDropOffController } from "./controller.js";
import type { CheckoutDropOffService } from "./types.js";

export async function registerCheckoutDropOffRoutes(
  app: FastifyInstance,
  service: CheckoutDropOffService,
): Promise<void> {
  const controller = createCheckoutDropOffController(service);
  app.get("/checkout/drop-offs", controller.list);
  app.post("/checkout/drop-offs/:id/draft", controller.createDraft);
}
