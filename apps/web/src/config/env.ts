import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
});

export const env = Object.freeze(envSchema.parse(process.env));
export const publicApiUrl = env.NEXT_PUBLIC_API_URL;
