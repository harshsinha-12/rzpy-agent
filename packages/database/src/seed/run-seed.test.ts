import { loadEnvFile } from "node:process";

import {
  actionTypes,
  actors,
  dataSources,
  failureCategories,
  paymentMethods,
  paymentStatuses,
  policyDecisions,
  recoverabilityBands,
  recoveryCaseStatuses,
} from "@recoveryos/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  ActionType,
  Actor,
  DataSource,
  FailureCategory,
  PaymentMethod,
  PaymentStatus,
  PolicyDecision,
  RecoverabilityBand,
  RecoveryCaseStatus,
} from "../generated/prisma/client.js";
import { createPrismaClient } from "../prisma.js";
import { buildSeedDataset } from "./scenarios.js";
import { runDemoSeed } from "./run-seed.js";

try {
  loadEnvFile(new URL("../../../../.env", import.meta.url));
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos";

function enumValues(record: Record<string, string>): string[] {
  return Object.values(record).sort();
}

describe("Prisma domain enums", () => {
  it("match the shared domain contracts", () => {
    expect(enumValues(DataSource)).toEqual([...dataSources].sort());
    expect(enumValues(PaymentMethod)).toEqual([...paymentMethods].sort());
    expect(enumValues(PaymentStatus)).toEqual([...paymentStatuses].sort());
    expect(enumValues(RecoveryCaseStatus)).toEqual(
      [...recoveryCaseStatuses].sort(),
    );
    expect(enumValues(FailureCategory)).toEqual([...failureCategories].sort());
    expect(enumValues(RecoverabilityBand)).toEqual(
      [...recoverabilityBands].sort(),
    );
    expect(enumValues(ActionType)).toEqual([...actionTypes].sort());
    expect(enumValues(PolicyDecision)).toEqual([...policyDecisions].sort());
    expect(enumValues(Actor)).toEqual([...actors].sort());
  });
});

describe("demo seed", () => {
  const prisma = createPrismaClient(databaseUrl);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("migrated tables accept a deterministic idempotent seed", async () => {
    const expected = buildSeedDataset(20260820);
    const first = await runDemoSeed(prisma, 20260820);
    const second = await runDemoSeed(prisma, 20260820);
    const cases = await prisma.recoveryCase.findMany({
      orderBy: { publicId: "asc" },
      select: {
        amountAtRiskPaise: true,
        dataSource: true,
        publicId: true,
        recoveredAmountPaise: true,
        status: true,
      },
    });

    expect(first).toEqual(second);
    expect(cases).toHaveLength(expected.scenarios.length);
    expect(cases.map((item) => item.publicId)).toEqual(
      expected.scenarios.map((scenario) => scenario.publicId).sort(),
    );
    expect(cases.every((item) => item.dataSource === "SIMULATED")).toBe(true);
    expect(
      cases.every(
        (item) =>
          Number.isInteger(item.amountAtRiskPaise) &&
          Number.isInteger(item.recoveredAmountPaise),
      ),
    ).toBe(true);

    const actionCount = await prisma.recoveryAction.count({
      where: { recoveryCase: { merchantId: first.merchantId } },
    });
    expect(actionCount).toBe(first.actionCount);
  });
});
