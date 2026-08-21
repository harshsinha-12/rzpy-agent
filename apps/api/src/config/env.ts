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
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: optionalPortSchema,
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  PORT: optionalPortSchema,
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://recoveryos:recoveryos@localhost:5432/recoveryos"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  RAZORPAY_TEST_MODE_API_KEY: z.string().default(""),
  RAZORPAY_TEST_MODE_SECRET_KEY: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
  REDIS_URL: z.string().url().default("redis://localhost:6380"),
});

const parsed = envSchema.parse(process.env);

export const env = Object.freeze({
  ...parsed,
  listenPort: parsed.API_PORT ?? parsed.PORT ?? 4000,
});
