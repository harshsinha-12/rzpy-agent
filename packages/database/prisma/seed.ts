import { loadEnvFile } from "node:process";

import { DEFAULT_DEMO_SEED } from "@recoveryos/domain";

import { createPrismaClient } from "../src/prisma.js";
import { assertDemoSeedAllowed } from "../src/seed/reset-policy.js";
import { runDemoSeed } from "../src/seed/run-seed.js";

const DEMO_SEED_MAX_WAIT_MS = 10_000;
const DEMO_SEED_TRANSACTION_TIMEOUT_MS = 30_000;

try {
  loadEnvFile(new URL("../../../.env", import.meta.url));
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos";
const seed = Number.parseInt(
  process.env.DEMO_SEED ?? String(DEFAULT_DEMO_SEED),
  10,
);

assertDemoSeedAllowed({
  confirmation: process.env.ALLOW_DEMO_RESET,
  nodeEnv: process.env.NODE_ENV,
});

const prisma = createPrismaClient(databaseUrl, {
  transactionOptions: {
    maxWait: DEMO_SEED_MAX_WAIT_MS,
    timeout: DEMO_SEED_TRANSACTION_TIMEOUT_MS,
  },
});

try {
  const summary = await runDemoSeed(prisma, seed);
  console.info(
    `Seeded ${summary.caseCount} recovery cases for merchant ${summary.merchantId} using seed ${summary.seed}.`,
  );
} finally {
  await prisma.$disconnect();
}
