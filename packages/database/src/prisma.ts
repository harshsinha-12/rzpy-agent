import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, Prisma } from "./generated/prisma/client.js";

export const DEFAULT_PRISMA_POOL_MAX = 3;

export interface PrismaConnectionOptions {
  max?: number;
}

export function createPrismaClient(
  connectionString: string,
  options: PrismaConnectionOptions = {},
): PrismaClient {
  const adapter = new PrismaPg({
    connectionString,
    max: options.max ?? DEFAULT_PRISMA_POOL_MAX,
  });
  return new PrismaClient({ adapter });
}

export { Prisma };
export type { PrismaClient };
