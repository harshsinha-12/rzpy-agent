import {
  createPrismaClient,
  runDemoSeed,
  type PrismaClient,
} from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../app.js";
import { createHealthService } from "../health/service.js";

describe.sequential("read-only product API", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let prisma: PrismaClient;

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
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it("lists cases with stable pagination and the reported-issues fields", async () => {
    const firstPage = await app.inject({
      method: "GET",
      url: "/recovery/cases?page=1&pageSize=2",
    });
    const secondPage = await app.inject({
      method: "GET",
      url: "/recovery/cases?page=2&pageSize=2",
    });

    expect(firstPage.statusCode).toBe(200);
    expect(secondPage.statusCode).toBe(200);

    const firstBody = firstPage.json();
    const secondBody = secondPage.json();
    expect(firstBody.meta).toEqual({
      page: 1,
      pageSize: 2,
      sortBy: "lastUpdatedAt",
      sortOrder: "desc",
      totalItems: 7,
      totalPages: 4,
    });
    expect(firstBody.data).toHaveLength(2);
    expect(secondBody.data).toHaveLength(2);
    expect(firstBody.data[0]).toMatchObject({
      amountAtRiskPaise: expect.any(Number),
      caseId: expect.stringMatching(/^RC-/),
      dataSource: "SIMULATED",
      failureReason: expect.any(String),
      orderId: expect.stringMatching(/^order_sim_/),
      paymentId: expect.stringMatching(/^pay_sim_/),
      recoveryStatus: expect.any(String),
    });
    expect(
      firstBody.data.map((item: { caseId: string }) => item.caseId),
    ).not.toEqual(
      secondBody.data.map((item: { caseId: string }) => item.caseId),
    );
  });

  it("combines filtering, search, and amount sorting", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/recovery/cases?status=RECOVERED&paymentMethod=UPI&search=pay_sim_rc1001&sortBy=amountAtRiskPaise&sortOrder=asc",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: [
        {
          caseId: "RC-1001",
          paymentId: "pay_sim_rc1001",
          paymentMethod: "UPI",
          recoveryStatus: "RECOVERED",
        },
      ],
      meta: { totalItems: 1, totalPages: 1 },
    });

    const sortedResponse = await app.inject({
      method: "GET",
      url: "/recovery/cases?pageSize=100&sortBy=amountAtRiskPaise&sortOrder=asc",
    });
    const amounts = sortedResponse
      .json()
      .data.map(
        (item: { amountAtRiskPaise: number }) => item.amountAtRiskPaise,
      );
    expect(amounts).toEqual([...amounts].sort((left, right) => left - right));
  });

  it("returns a complete normalized case detail without the raw payload", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/recovery/cases/RC-1001",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toMatchObject({
      caseId: "RC-1001",
      customer: {
        dataSource: "SIMULATED",
        externalRef: "cust_priya_nair",
      },
      dataSource: "SIMULATED",
      payment: {
        paymentId: "pay_sim_rc1001",
        status: "FAILED",
      },
      recoveryStatus: "RECOVERED",
    });
    expect(body.data.actions.length).toBeGreaterThan(0);
    expect(body.data.auditTimeline.length).toBeGreaterThan(0);
    expect(body.data.diagnosisEvidence.length).toBeGreaterThan(0);
    expect(body.data.payment).not.toHaveProperty("rawPayload");
  });

  it("returns the consistent validation envelope for invalid queries", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/recovery/cases?page=0&pageSize=101&unexpected=true",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        details: expect.any(Array),
        message: "The request contains invalid parameters.",
        requestId: expect.any(String),
      },
    });
  });

  it("returns the consistent missing-case envelope", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/recovery/cases/RC-DOES-NOT-EXIST",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: {
        code: "RECOVERY_CASE_NOT_FOUND",
        message: "Recovery case RC-DOES-NOT-EXIST was not found.",
        requestId: expect.any(String),
      },
    });
  });

  it("reconciles overview analytics exactly with persisted seeded records", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/analytics/overview",
    });
    const [amounts, totalCases, recoveredCases] = await Promise.all([
      prisma.recoveryCase.aggregate({
        _sum: {
          amountAtRiskPaise: true,
          recoveredAmountPaise: true,
        },
        where: { merchant: { slug: DEMO_MERCHANT_SLUG } },
      }),
      prisma.recoveryCase.count({
        where: { merchant: { slug: DEMO_MERCHANT_SLUG } },
      }),
      prisma.recoveryCase.count({
        where: {
          merchant: { slug: DEMO_MERCHANT_SLUG },
          status: "RECOVERED",
        },
      }),
    ]);

    expect(response.statusCode).toBe(200);
    const overview = response.json().data;
    expect(overview.dataSources).toEqual(["SIMULATED"]);
    expect(overview.funnel).toMatchObject({
      recoveredCases,
      totalCases,
    });
    expect(overview.kpis).toMatchObject({
      recoveredRevenuePaise: amounts._sum.recoveredAmountPaise,
      totalRevenueAtRiskPaise: amounts._sum.amountAtRiskPaise,
    });
    expect(
      overview.failureBreakdown.reduce(
        (total: number, item: { count: number }) => total + item.count,
        0,
      ),
    ).toBe(totalCases);
    expect(
      overview.recoveryStatusBreakdown.reduce(
        (total: number, item: { revenueAtRiskPaise: number }) =>
          total + item.revenueAtRiskPaise,
        0,
      ),
    ).toBe(amounts._sum.amountAtRiskPaise);
  });
});
