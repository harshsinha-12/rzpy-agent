import type { PoolConfig } from "pg";

export function createPostgresPoolConfig(
  connectionString: string,
  max: number,
): PoolConfig {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const hasRootCertificate = url.searchParams.has("sslrootcert");
  const usesLibpqCompatibility =
    url.searchParams.get("uselibpqcompat") === "true";

  if (sslMode === "require" && !hasRootCertificate && !usesLibpqCompatibility) {
    // Aiven's sslmode=require contract encrypts transport without requiring a
    // custom CA. pg 8 currently aliases it to verify-full, so express the
    // standard libpq behavior explicitly instead of disabling TLS globally.
    url.searchParams.delete("sslmode");

    return {
      connectionString: url.toString(),
      max,
      ssl: { rejectUnauthorized: false },
    };
  }

  return { connectionString, max };
}
