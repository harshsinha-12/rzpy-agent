import { Pool } from "pg";

import { createPostgresPoolConfig } from "./connection-config.js";

export const DEFAULT_DATABASE_HEALTH_POOL_MAX = 1;

export interface DatabasePoolOptions {
  max?: number;
}

export function createDatabasePool(
  connectionString: string,
  options: DatabasePoolOptions = {},
): Pool {
  return new Pool(
    createPostgresPoolConfig(
      connectionString,
      options.max ?? DEFAULT_DATABASE_HEALTH_POOL_MAX,
    ),
  );
}

export async function checkDatabaseConnection(pool: Pool): Promise<void> {
  await pool.query("SELECT 1");
}

export async function closeDatabasePool(pool: Pool): Promise<void> {
  await pool.end();
}
