import { loadEnvFile } from "node:process";

import { resolveRedisUrl } from "@recoveryos/config";
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

const optionalStringSchema = z.preprocess(
  (value) => (value === undefined || value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrlSchema = z.preprocess(
  (value) => (value === undefined || value === "" ? undefined : value),
  z.string().url().optional(),
);

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
  REDIS_HOST: optionalStringSchema,
  REDIS_PASSWORD: optionalStringSchema,
  REDIS_PORT: optionalPortSchema,
  REDIS_TLS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  REDIS_URL: optionalUrlSchema,
  REDIS_USERNAME: optionalStringSchema,
});

const parsed = envSchema.parse(process.env);
const redisUrl = resolveRedisUrl(parsed);

export const env = Object.freeze({
  ...parsed,
  REDIS_URL: redisUrl,
  // Hosting platforms such as Railway route traffic and health checks to PORT.
  // Keep API_PORT as the local override only when no platform port is present.
  listenPort: parsed.PORT ?? parsed.API_PORT ?? 4000,
});
