import cors from "@fastify/cors";
import { createPrismaClient, type PrismaClient } from "@recoveryos/database";
import {
  paymentEventJobId,
  paymentEventsQueueName,
  processPaymentEventJobName,
  recoveryJobAttempts,
  recoveryJobBackoffMs,
  type PaymentEventJobData,
} from "@recoveryos/domain";
import { createRazorpayClient } from "@recoveryos/razorpay";
import { Queue } from "bullmq";
import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env.js";
import { registerErrorHandlers } from "./lib/error-handler.js";
import { createApiLogger } from "./lib/logger.js";
import { createBullMqConnectionOptions } from "./lib/queue-connection.js";
import { createAnalyticsRepository } from "./modules/analytics/repository.js";
import { registerAnalyticsRoutes } from "./modules/analytics/routes.js";
import { createAnalyticsService } from "./modules/analytics/service.js";
import type { AnalyticsService } from "./modules/analytics/types.js";
import { createCheckoutDropOffRepository } from "./modules/checkout-dropoffs/repository.js";
import { registerCheckoutDropOffRoutes } from "./modules/checkout-dropoffs/routes.js";
import { createCheckoutDropOffService } from "./modules/checkout-dropoffs/service.js";
import { createDemoCheckoutService } from "./modules/demo/razorpay/service.js";
import { registerDemoCheckoutRoutes } from "./modules/demo/razorpay/routes.js";
import type { DemoCheckoutService } from "./modules/demo/razorpay/types.js";
import { registerHealthRoutes } from "./modules/health/routes.js";
import {
  createRuntimeHealthService,
  type HealthService,
} from "./modules/health/service.js";
import { createRecoveryCaseRepository } from "./modules/recoveries/repository.js";
import { registerRecoveryCaseRoutes } from "./modules/recoveries/routes.js";
import { createRecoveryCaseService } from "./modules/recoveries/service.js";
import type { RecoveryCaseService } from "./modules/recoveries/types.js";
import { createSimulatorRepository } from "./modules/simulator/repository.js";
import { registerSimulatorRoutes } from "./modules/simulator/routes.js";
import { createSimulatorService } from "./modules/simulator/service.js";
import type { SimulatorService } from "./modules/simulator/types.js";
import { createRazorpayWebhookRepository } from "./modules/webhooks/razorpay/repository.js";
import { registerRazorpayWebhookRoutes } from "./modules/webhooks/razorpay/routes.js";
import { createRazorpayWebhookService } from "./modules/webhooks/razorpay/service.js";
import type {
  PaymentEventJobQueue,
  RazorpayWebhookService,
} from "./modules/webhooks/razorpay/types.js";
import { registerSecurityPlugins } from "./plugins/security.js";

interface BuildAppOptions {
  analyticsService?: AnalyticsService;
  database?: PrismaClient;
  demoCheckoutService?: DemoCheckoutService;
  healthService?: HealthService;
  logger?: boolean;
  paymentEventQueue?: PaymentEventJobQueue;
  rateLimitMax?: number;
  recoveryCaseService?: RecoveryCaseService;
  razorpayWebhookSecret?: string;
  razorpayWebhookService?: RazorpayWebhookService;
  simulatorService?: SimulatorService;
}

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const app =
    options.logger === false
      ? Fastify({ logger: false })
      : Fastify({ logger: createApiLogger() });
  const healthService =
    options.healthService ??
    createRuntimeHealthService({
      databaseUrl: env.DATABASE_URL,
      redisUrl: env.REDIS_URL,
    });
  const needsDatabase =
    !options.analyticsService ||
    !options.recoveryCaseService ||
    !options.razorpayWebhookService ||
    !options.simulatorService;
  const database = needsDatabase
    ? (options.database ??
      createPrismaClient(env.DATABASE_URL, { max: env.DATABASE_POOL_MAX }))
    : null;
  const ownsDatabase = database !== null && !options.database;
  const analyticsService =
    options.analyticsService ??
    createAnalyticsService(createAnalyticsRepository(database!));
  const recoveryCaseService =
    options.recoveryCaseService ??
    createRecoveryCaseService(createRecoveryCaseRepository(database!));
  const checkoutDropOffService = createCheckoutDropOffService(
    createCheckoutDropOffRepository(database!),
    createRuntimeCheckoutDropOffPaymentLinks(
      env.RAZORPAY_TEST_MODE_API_KEY,
      env.RAZORPAY_TEST_MODE_SECRET_KEY,
    ),
  );
  const simulatorService =
    options.simulatorService ??
    createSimulatorService(createSimulatorRepository(database!));
  const ownsQueue =
    !options.paymentEventQueue &&
    !options.razorpayWebhookService &&
    options.logger !== false;
  const paymentEventQueue =
    options.paymentEventQueue ??
    (ownsQueue
      ? createRuntimePaymentEventQueue(env.REDIS_URL)
      : { enqueue: async () => undefined });
  const razorpayWebhookService =
    options.razorpayWebhookService ??
    createRazorpayWebhookService({
      queue: paymentEventQueue,
      repository: createRazorpayWebhookRepository(database!),
      webhookSecret:
        options.razorpayWebhookSecret ?? env.RAZORPAY_WEBHOOK_SECRET,
    });
  const demoCheckoutService =
    options.demoCheckoutService ??
    createRuntimeDemoCheckoutService(
      env.RAZORPAY_TEST_MODE_API_KEY,
      env.RAZORPAY_TEST_MODE_SECRET_KEY,
    );

  app.addHook("onClose", async () => {
    await Promise.all([
      healthService.close(),
      ownsDatabase ? database!.$disconnect() : Promise.resolve(),
      ownsQueue && "close" in paymentEventQueue
        ? (
            paymentEventQueue as PaymentEventJobQueue & {
              close: () => Promise<void>;
            }
          ).close()
        : Promise.resolve(),
    ]);
  });

  await app.register(cors, {
    methods: ["GET", "POST"],
    origin: env.APP_BASE_URL,
  });
  await registerSecurityPlugins(app, {
    rateLimitMax:
      options.rateLimitMax ?? (env.NODE_ENV === "test" ? 1_000 : 120),
  });
  registerErrorHandlers(app);
  await registerHealthRoutes(app, healthService);
  await registerRecoveryCaseRoutes(app, recoveryCaseService);
  await registerCheckoutDropOffRoutes(app, checkoutDropOffService);
  await registerAnalyticsRoutes(app, analyticsService);
  await registerSimulatorRoutes(app, simulatorService);
  await registerRazorpayWebhookRoutes(app, razorpayWebhookService);
  await registerDemoCheckoutRoutes(app, demoCheckoutService);

  return app;
}

function createRuntimePaymentEventQueue(
  redisUrl: string,
): PaymentEventJobQueue & { close: () => Promise<void> } {
  const queue = new Queue<PaymentEventJobData>(paymentEventsQueueName, {
    connection: createBullMqConnectionOptions(redisUrl),
  });

  return {
    close: () => queue.close(),
    enqueue: async (data) => {
      await queue.add(processPaymentEventJobName, data, {
        attempts: recoveryJobAttempts,
        backoff: {
          delay: recoveryJobBackoffMs,
          type: "exponential",
        },
        jobId: paymentEventJobId(data.webhookEventId),
        removeOnComplete: 200,
        removeOnFail: false,
      });
    },
  };
}

function createRuntimeDemoCheckoutService(keyId: string, keySecret: string) {
  if (!keyId || !keySecret) {
    return createDemoCheckoutService({ keyId: "" });
  }

  return createDemoCheckoutService({
    keyId,
    orders: createRazorpayClient({
      keyId,
      keySecret,
      mode: "test",
    }),
  });
}

function createRuntimeCheckoutDropOffPaymentLinks(
  keyId: string,
  keySecret: string,
) {
  if (!keyId || !keySecret) {
    return {
      async ensure(): Promise<never> {
        throw new Error("Razorpay Test Mode Payment Links are not configured.");
      },
    };
  }

  const client = createRazorpayClient({ keyId, keySecret, mode: "test" });
  return {
    async ensure(input: {
      amountPaise: number;
      caseId: string;
      currency: "INR";
      customerName: string;
      orderId: string;
    }) {
      const result = await client.ensurePaymentLink({
        amountPaise: input.amountPaise,
        currency: input.currency,
        description: `Checkout recovery for ${input.orderId}`,
        notes: {
          checkout_drop_off: input.caseId,
          customer_name: input.customerName,
          source: "recoveryos_checkout_dropoff",
        },
        referenceId: `checkout_${input.caseId.replaceAll(/[^a-zA-Z0-9]/g, "").slice(0, 31)}`,
      });
      return { id: result.paymentLink.id, url: result.paymentLink.short_url };
    },
  };
}
