import {
  checkDatabaseConnection,
  closeDatabasePool,
  createDatabasePool,
} from "@recoveryos/database";
import type { DependencyHealth, HealthSnapshot } from "@recoveryos/domain";
import { Redis } from "ioredis";

export interface HealthService {
  close(): Promise<void>;
  getSnapshot(): Promise<HealthSnapshot>;
}

interface HealthServiceChecks {
  close(): Promise<void>;
  postgres(): Promise<void>;
  redis(): Promise<void>;
}

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

export function createHealthService(
  checks: HealthServiceChecks,
): HealthService {
  return {
    close: checks.close,
    async getSnapshot() {
      const [postgres, redis] = await Promise.all([
        checkDependency(checks.postgres),
        checkDependency(checks.redis),
      ]);
      const status =
        postgres.status === "up" && redis.status === "up"
          ? "healthy"
          : "degraded";

      return {
        dependencies: { postgres, redis },
        service: "api",
        status,
        timestamp: new Date().toISOString(),
      };
    },
  };
}

export function createRuntimeHealthService(options: {
  databaseUrl: string;
  redisUrl: string;
}): HealthService {
  const database = createDatabasePool(options.databaseUrl);
  const redis = new Redis(options.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  return createHealthService({
    async close() {
      await Promise.all([
        closeDatabasePool(database),
        redis.status === "wait" || redis.status === "end"
          ? Promise.resolve()
          : redis.quit(),
      ]);
    },
    async postgres() {
      await checkDatabaseConnection(database);
    },
    async redis() {
      if (redis.status === "wait") {
        await redis.connect();
      }
      await redis.ping();
    },
  });
}
