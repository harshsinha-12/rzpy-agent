import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../app.js";
import { createHealthService } from "../modules/health/service.js";

const apps: Awaited<ReturnType<typeof buildApp>>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe("API security plugins", () => {
  it("adds secure response headers", async () => {
    const app = await buildApp(securityTestApp());
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["strict-transport-security"]).toEqual(
      expect.stringContaining("max-age="),
    );
  });

  it("rate limits bursty product API traffic", async () => {
    const app = await buildApp({
      ...securityTestApp(),
      rateLimitMax: 2,
    });
    apps.push(app);

    const first = await app.inject({ method: "GET", url: "/recovery/cases" });
    const second = await app.inject({ method: "GET", url: "/recovery/cases" });
    const third = await app.inject({ method: "GET", url: "/recovery/cases" });

    expect(first.statusCode).not.toBe(429);
    expect(second.statusCode).not.toBe(429);
    expect(third.statusCode).toBe(429);
    expect(third.json()).toMatchObject({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: expect.stringContaining("Rate limit"),
      },
    });
  });

  it("does not rate-limit health checks", async () => {
    const app = await buildApp({
      ...securityTestApp(),
      rateLimitMax: 1,
    });
    apps.push(app);

    const first = await app.inject({ method: "GET", url: "/health" });
    const second = await app.inject({ method: "GET", url: "/health/live" });
    const third = await app.inject({ method: "GET", url: "/health/live" });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(third.statusCode).toBe(200);
  });
});

function securityTestApp() {
  return {
    analyticsService: {
      getOverview: async () => ({ data: {} }),
    },
    healthService: createHealthService({
      close: async () => undefined,
      postgres: async () => undefined,
      redis: async () => undefined,
    }),
    logger: false as const,
    recoveryCaseService: {
      getById: async () => ({ data: {} }),
      list: async () => ({ data: [] }),
    },
    razorpayWebhookService: {
      ingest: async () => ({ duplicate: false, webhookEventId: "unused" }),
    },
    simulatorService: {
      run: async () => ({ data: {} }) as never,
    },
  };
}
