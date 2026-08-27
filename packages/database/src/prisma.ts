import { PrismaPg } from "@prisma/adapter-pg";

import { createPostgresPoolConfig } from "./connection-config.js";
import { PrismaClient, Prisma } from "./generated/prisma/client.js";

export const DEFAULT_PRISMA_POOL_MAX = 3;

export interface PrismaConnectionOptions {
  max?: number;
  transactionOptions?: {
    maxWait?: number;
    timeout?: number;
  };
}

export function createPrismaClient(
  connectionString: string,
  options: PrismaConnectionOptions = {},
): PrismaClient {
  const adapter = new PrismaPg(
    createPostgresPoolConfig(
      connectionString,
      options.max ?? DEFAULT_PRISMA_POOL_MAX,
    ),
  );
  return new PrismaClient({
    adapter,
    ...(options.transactionOptions
      ? { transactionOptions: options.transactionOptions }
      : {}),
  });
}

export { Prisma };
export type { PrismaClient };
