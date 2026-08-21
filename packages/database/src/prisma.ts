import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, Prisma } from "./generated/prisma/client.js";

export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export { Prisma };
export type { PrismaClient };
