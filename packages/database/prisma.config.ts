import { loadEnvFile } from "node:process";

import { defineConfig, env } from "prisma/config";

try {
  loadEnvFile(new URL("../../.env", import.meta.url));
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

process.env.DATABASE_URL ??=
  "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
