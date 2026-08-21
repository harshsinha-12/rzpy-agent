import { loadEnvFile } from "node:process";

import { z } from "zod";

try {
  loadEnvFile(new URL("../../../../.env", import.meta.url));
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

const optionalPortSchema = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  return value;
}, z.coerce.number().int().positive().optional());

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://recoveryos:recoveryos@localhost:5432/recoveryos"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  OPENAI_API_KEY: z
    .string()
    .trim()
    .default("")
    .transform((value) => value || undefined),
  OPENAI_MODEL: z.string().trim().min(1).default("gpt-5.6-terra"),
  PORT: optionalPortSchema,
  RAZORPAY_TEST_MODE_API_KEY: z.string().trim().default(""),
  RAZORPAY_TEST_MODE_SECRET_KEY: z.string().trim().default(""),
  REDIS_URL: z.string().url().default("redis://localhost:6380"),
  WORKER_HEALTH_HOST: z.string().default("0.0.0.0"),
  WORKER_HEALTH_PORT: optionalPortSchema,
});

const parsed = envSchema.parse(process.env);

export const env = Object.freeze({
  ...parsed,
  // Hosting platforms such as Railway route traffic and health checks to PORT.
  // Keep WORKER_HEALTH_PORT as the local override only when no platform port exists.
  listenPort: parsed.PORT ?? parsed.WORKER_HEALTH_PORT ?? 4001,
});
