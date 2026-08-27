import { describe, expect, it } from "vitest";

import {
  closeDatabasePool,
  createDatabasePool,
  DEFAULT_DATABASE_HEALTH_POOL_MAX,
} from "./client.js";

const connectionString =
  "postgresql://user:password@postgres.example.com:5432/database?sslmode=require";

describe("createDatabasePool", () => {
  it("uses one connection by default for dependency health checks", async () => {
    const pool = createDatabasePool(connectionString);

    expect(pool.options.max).toBe(DEFAULT_DATABASE_HEALTH_POOL_MAX);

    await closeDatabasePool(pool);
  });

  it("accepts an explicit pool limit", async () => {
    const pool = createDatabasePool(connectionString, { max: 2 });

    expect(pool.options.max).toBe(2);

    await closeDatabasePool(pool);
  });
});
