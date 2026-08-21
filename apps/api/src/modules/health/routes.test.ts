import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../../app.js";
import { createHealthService } from "./service.js";

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("GET /health", () => {
  it("returns 200 for liveness without checking dependencies", async () => {
    const app = await buildApp({
      healthService: createHealthService({
        close: async () => undefined,
        postgres: async () => {
          throw new Error("database unavailable");
        },
        redis: async () => {
          throw new Error("redis unavailable");
        },
      }),
      logger: false,
    });
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/health/live" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      service: "api",
      status: "live",
    });
  });

  it("returns 200 when PostgreSQL and Redis are reachable", async () => {
    const app = await buildApp({
      healthService: createHealthService({
        close: async () => undefined,
        postgres: async () => undefined,
        redis: async () => undefined,
      }),
      logger: false,
    });
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      dependencies: {
        postgres: { error: null, status: "up" },
        redis: { error: null, status: "up" },
      },
      service: "api",
      status: "healthy",
    });
  });

  it("returns 503 and identifies an unavailable dependency", async () => {
    const app = await buildApp({
      healthService: createHealthService({
        close: async () => undefined,
        postgres: async () => {
          throw new Error("database unavailable");
        },
        redis: async () => undefined,
      }),
      logger: false,
    });
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      dependencies: {
        postgres: { error: "database unavailable", status: "down" },
      },
      status: "degraded",
    });
  });
});
