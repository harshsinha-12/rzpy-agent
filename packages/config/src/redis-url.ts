export interface RedisConnectionEnvironment {
  REDIS_HOST?: string | undefined;
  REDIS_PASSWORD?: string | undefined;
  REDIS_PORT?: number | undefined;
  REDIS_TLS?: boolean | undefined;
  REDIS_URL?: string | undefined;
  REDIS_USERNAME?: string | undefined;
}

export function resolveRedisUrl(
  environment: RedisConnectionEnvironment,
  fallback = "redis://localhost:6380",
): string {
  const directUrl = environment.REDIS_URL?.trim();
  if (directUrl) {
    return directUrl;
  }

  const host = environment.REDIS_HOST?.trim();
  if (!host) {
    return fallback;
  }

  const password = environment.REDIS_PASSWORD;
  if (!password) {
    throw new Error(
      "REDIS_PASSWORD is required when REDIS_HOST is configured.",
    );
  }

  const url = new URL(
    `${environment.REDIS_TLS ? "rediss" : "redis"}://${host}`,
  );
  url.username = environment.REDIS_USERNAME?.trim() || "default";
  url.password = password;
  url.port = String(environment.REDIS_PORT ?? 6379);

  return url.toString();
}
