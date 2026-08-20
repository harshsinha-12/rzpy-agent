import { loadEnvFile } from "node:process";

import { DEFAULT_DEMO_SEED } from "@recoveryos/domain";

import { createPrismaClient } from "../src/prisma.js";
import { runDemoSeed } from "../src/seed/run-seed.js";

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

const prisma = createPrismaClient(databaseUrl);

try {
  const summary = await runDemoSeed(prisma, seed);
  console.info(
    `Seeded ${summary.caseCount} recovery cases for merchant ${summary.merchantId} using seed ${summary.seed}.`,
  );
} finally {
  await prisma.$disconnect();
}
