import {
  checkDatabaseConnection,
  closeDatabasePool,
  createDatabasePool,
  createPrismaClient,
} from "@recoveryos/database";
import {
  paymentEventsQueueName,
  type DependencyHealth,
  type HealthSnapshot,
  type PaymentEventJobData,
} from "@recoveryos/domain";
import { Worker } from "bullmq";
import { Redis } from "ioredis";

import { env } from "./config/env.js";
import { startHealthServer } from "./health-server.js";
import { processPaymentEvent } from "./jobs/process-payment-event.js";
import { processSystemHealthJob } from "./jobs/system-health.js";
import { createBullMqConnectionOptions } from "./queues/connection.js";
import { SYSTEM_HEALTH_QUEUE } from "./queues/names.js";

const database = createDatabasePool(env.DATABASE_URL);
const prisma = createPrismaClient(env.DATABASE_URL);
const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});
const connection = createBullMqConnectionOptions(env.REDIS_URL);
const healthWorker = new Worker(SYSTEM_HEALTH_QUEUE, processSystemHealthJob, {
  connection,
});
const paymentWorker = new Worker<PaymentEventJobData>(
  paymentEventsQueueName,
  async (job) => processPaymentEvent(prisma, job.data.webhookEventId),
  { connection },
);

async function checkDependency(
  check: () => Promise<void>,
): Promise<DependencyHealth> {
  try {
    await check();
    return { error: null, status: "up" };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unknown dependency error",
      status: "down",
    };
  }
}

async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const [postgres, redisHealth] = await Promise.all([
    checkDependency(async () => checkDatabaseConnection(database)),
    checkDependency(async () => {
      if (redis.status === "wait") {
        await redis.connect();
      }
      await redis.ping();
    }),
  ]);

  return {
    dependencies: { postgres, redis: redisHealth },
    service: "worker",
    status:
      postgres.status === "up" && redisHealth.status === "up"
        ? "healthy"
        : "degraded",
    timestamp: new Date().toISOString(),
  };
}

await Promise.all([
  healthWorker.waitUntilReady(),
  paymentWorker.waitUntilReady(),
]);

const healthServer = await startHealthServer({
  getSnapshot: getHealthSnapshot,
  host: env.WORKER_HEALTH_HOST,
  port: env.WORKER_HEALTH_PORT,
});

console.info(
  `Worker ready; health endpoint listening on ${env.WORKER_HEALTH_HOST}:${env.WORKER_HEALTH_PORT}`,
);

const shutdown = async (signal: string) => {
  console.info(`Stopping worker after ${signal}`);
  healthServer.close();
  await Promise.all([
    healthWorker.close(),
    paymentWorker.close(),
    prisma.$disconnect(),
    closeDatabasePool(database),
    redis.status === "wait" || redis.status === "end"
      ? Promise.resolve()
      : redis.quit(),
  ]);
  process.exit(0);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
