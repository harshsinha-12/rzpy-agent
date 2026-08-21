import {
  createOpenAIRecoveryAgent,
  createRecoveryAgent,
} from "@recoveryos/agents";
import {
  checkDatabaseConnection,
  closeDatabasePool,
  createDatabasePool,
  createPrismaClient,
} from "@recoveryos/database";
import {
  DEMO_MERCHANT_SLUG,
  type DependencyHealth,
  type HealthSnapshot,
} from "@recoveryos/domain";
import { Worker } from "bullmq";
import { Redis } from "ioredis";

import { createPrismaRecoveryAgentTools } from "./agents/recovery-context.js";
import { env } from "./config/env.js";
import { startHealthServer } from "./health-server.js";
import { processSystemHealthJob } from "./jobs/system-health.js";
import { createBullMqConnectionOptions } from "./queues/connection.js";
import { SYSTEM_HEALTH_QUEUE } from "./queues/names.js";
import { createRecoveryJobQueues } from "./queues/recovery-queues.js";
import { createRecoveryWorkers } from "./queues/register-workers.js";
import { createRecoveryActionExecutor } from "./tools/recovery-action-executor.js";
import { createRuntimeRecoveryExecutionTools } from "./tools/runtime-recovery-tools.js";

const database = createDatabasePool(env.DATABASE_URL);
const prisma = createPrismaClient(env.DATABASE_URL);
const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});
const connection = createBullMqConnectionOptions(env.REDIS_URL);
const queues = createRecoveryJobQueues(env.REDIS_URL);
const recoveryAgentTools = createPrismaRecoveryAgentTools(prisma);
const recoveryAgent = env.OPENAI_API_KEY
  ? createOpenAIRecoveryAgent({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      tools: recoveryAgentTools,
    })
  : createRecoveryAgent({ tools: recoveryAgentTools });
const recoveryExecutionTools = createRuntimeRecoveryExecutionTools();
const recoveryActionExecutor = createRecoveryActionExecutor(
  prisma,
  recoveryExecutionTools,
);

const healthWorker = new Worker(SYSTEM_HEALTH_QUEUE, processSystemHealthJob, {
  connection,
});
const recoveryWorkers = createRecoveryWorkers({
  connection,
  prisma,
  queues,
  recoveryAgent,
  recoveryTools: recoveryExecutionTools,
  toolExecutor: recoveryActionExecutor,
});

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
  ...recoveryWorkers.map((worker) => worker.waitUntilReady()),
  queues.scheduleReconciliation(DEMO_MERCHANT_SLUG),
]);

const healthServer = await startHealthServer({
  getSnapshot: getHealthSnapshot,
  host: env.WORKER_HEALTH_HOST,
  port: env.listenPort,
});

console.info(
  JSON.stringify({
    event: "worker.ready",
    healthPort: env.listenPort,
    queues: recoveryWorkers.map((worker) => worker.name),
  }),
);

const shutdown = async (signal: string) => {
  console.info(JSON.stringify({ event: "worker.stopping", signal }));
  healthServer.close();
  await Promise.all([
    healthWorker.close(),
    ...recoveryWorkers.map((worker) => worker.close()),
    queues.close(),
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
