import type { FastifyInstance } from "fastify";

import { createDemoCheckoutController } from "./controller.js";
import type { DemoCheckoutService } from "./types.js";

export async function registerDemoCheckoutRoutes(
  app: FastifyInstance,
  service: DemoCheckoutService,
): Promise<void> {
  const controller = createDemoCheckoutController(service);

  app.get("/demo/razorpay/checkout", controller.getStatus);
  app.post("/demo/razorpay/orders", controller.createOrder);
}
