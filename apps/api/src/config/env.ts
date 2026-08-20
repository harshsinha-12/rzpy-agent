import { loadEnvFile } from "node:process";

import { z } from "zod";

try {
  loadEnvFile(new URL("../../../../.env", import.meta.url));
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

const envSchema = z.object({
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://recoveryos:recoveryos@localhost:5432/recoveryos"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  REDIS_URL: z.string().url().default("redis://localhost:6380"),
});

export const env = Object.freeze(envSchema.parse(process.env));
