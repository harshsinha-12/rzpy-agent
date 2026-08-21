import "server-only";

import { z } from "zod";

import { env } from "@/config/env";

const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional(),
  }),
});

export class ApiClientError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function getApi<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(new URL(path, env.API_BASE_URL), {
    cache: "no-store",
    headers: { accept: "application/json" },
    ...(signal ? { signal } : {}),
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const errorEnvelope = errorEnvelopeSchema.safeParse(body);
    throw new ApiClientError(
      response.status,
      errorEnvelope.success
        ? errorEnvelope.data.error.code
        : "API_REQUEST_FAILED",
      errorEnvelope.success
        ? errorEnvelope.data.error.message
        : "RecoveryOS could not load this data.",
    );
  }

  return schema.parse(body);
}
