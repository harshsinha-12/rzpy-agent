import { z } from "zod";

function defaultAppBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

const envSchema = z.object({
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  APP_BASE_URL: z.string().url().default(defaultAppBaseUrl()),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_WORKER_HEALTH_URL: z
    .string()
    .url()
    .default("http://localhost:4001"),
});

export const env = Object.freeze(envSchema.parse(process.env));
export const appBaseUrl = env.APP_BASE_URL;
export const publicApiUrl = env.NEXT_PUBLIC_API_URL;
export const publicWorkerHealthUrl = env.NEXT_PUBLIC_WORKER_HEALTH_URL;
