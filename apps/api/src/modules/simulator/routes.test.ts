import {
  createPrismaClient,
  runDemoSeed,
  type PrismaClient,
} from "@recoveryos/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../app.js";
import { createHealthService } from "../health/service.js";

describe.sequential("simulation API", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let prisma: PrismaClient;
  const createdRunIds = new Set<string>();

  beforeAll(async () => {
    const databaseUrl =
      process.env.DATABASE_URL ??
      "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos";
    prisma = createPrismaClient(databaseUrl);
    await prisma.$connect();
    await runDemoSeed(prisma, 20260820);
    app = await buildApp({
      database: prisma,
      healthService: createHealthService({
        close: async () => undefined,
        postgres: async () => undefined,
        redis: async () => undefined,
      }),
      logger: false,
    });
  });

  afterAll(async () => {
    if (prisma && createdRunIds.size > 0) {
      await prisma.simulationRun.deleteMany({
        where: { id: { in: [...createdRunIds] } },
      });
    }
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it("runs and persists a deterministic three-strategy evaluation", async () => {
    const request = { paymentCount: 250, seed: 424_242 };
    const first = await app.inject({
      method: "POST",
      payload: request,
      url: "/simulator/run",
    });
    const second = await app.inject({
      method: "POST",
      payload: request,
      url: "/simulator/run",
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    const firstRun = first.json().data;
    const secondRun = second.json().data;
    createdRunIds.add(firstRun.id);

    expect(firstRun).toMatchObject({
      configuration: request,
      dataSource: "SIMULATED",
      outcomeCount: 750,
      strategies: {
        NAIVE_RETRY: { strategy: "NAIVE_RETRY" },
        NO_INTERVENTION: { strategy: "NO_INTERVENTION" },
        RECOVERY_OS: { strategy: "RECOVERY_OS" },
      },
    });
    expect(secondRun.configurationHash).toBe(firstRun.configurationHash);
    expect(secondRun.revenueAtRiskPaise).toBe(firstRun.revenueAtRiskPaise);
    expect(secondRun.strategies).toEqual(firstRun.strategies);
    expect(firstRun.incrementalRevenuePaise).toBe(
      firstRun.strategies.RECOVERY_OS.recoveredRevenuePaise -
        firstRun.strategies.NAIVE_RETRY.recoveredRevenuePaise,
    );

    const stored = await prisma.simulationRun.findUniqueOrThrow({
      include: { outcomes: true },
      where: { id: firstRun.id },
    });
    expect(stored.outcomes).toHaveLength(750);
    expect(stored.noInterventionRevenuePaise).toBe(
      firstRun.strategies.NO_INTERVENTION.recoveredRevenuePaise,
    );

    for (const strategy of [
      "NO_INTERVENTION",
      "NAIVE_RETRY",
      "RECOVERY_OS",
    ] as const) {
      const outcomes = stored.outcomes.filter(
        (outcome) => outcome.strategy === strategy,
      );
      const metrics = firstRun.strategies[strategy];
      expect(outcomes).toHaveLength(250);
      expect(outcomes.reduce((sum, outcome) => sum + outcome.attempts, 0)).toBe(
        metrics.attempts,
      );
      expect(outcomes.filter((outcome) => outcome.recovered)).toHaveLength(
        metrics.recoveredCount,
      );
      expect(
        outcomes.reduce(
          (sum, outcome) => sum + outcome.recoveredAmountPaise,
          0,
        ),
      ).toBe(metrics.recoveredRevenuePaise);
    }

    expect(JSON.stringify(stored.outcomes[0]?.visibleInput)).not.toMatch(
      /hidden|probability|threshold/i,
    );
  });

  it("rejects simulator batches outside the approved range", async () => {
    const response = await app.inject({
      method: "POST",
      payload: { paymentCount: 249, seed: 1 },
      url: "/simulator/run",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "INVALID_SIMULATION_CONFIGURATION",
        message: expect.stringContaining("250 to 500"),
        requestId: expect.any(String),
      },
    });
  });
});
