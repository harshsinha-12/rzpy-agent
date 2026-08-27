import { describe, expect, it } from "vitest";

import { createPostgresPoolConfig } from "./connection-config.js";

describe("createPostgresPoolConfig", () => {
  it("keeps Aiven-style require mode encrypted without requiring a custom CA", () => {
    const config = createPostgresPoolConfig(
      "postgresql://user:password@postgres.example.com:12347/database?sslmode=require",
      3,
    );

    expect(config.max).toBe(3);
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
    expect(new URL(config.connectionString!).searchParams.has("sslmode")).toBe(
      false,
    );
  });

  it("preserves verify-full for certificate-verified connections", () => {
    const connectionString =
      "postgresql://user:password@postgres.example.com:5432/database?sslmode=verify-full";

    expect(createPostgresPoolConfig(connectionString, 3)).toEqual({
      connectionString,
      max: 3,
    });
  });

  it("preserves require mode when a root certificate is configured", () => {
    const connectionString =
      "postgresql://user:password@postgres.example.com:5432/database?sslmode=require&sslrootcert=%2Fapp%2Fca.pem";

    expect(createPostgresPoolConfig(connectionString, 3)).toEqual({
      connectionString,
      max: 3,
    });
  });

  it("does not add TLS to local connections", () => {
    const connectionString =
      "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos";

    expect(createPostgresPoolConfig(connectionString, 1)).toEqual({
      connectionString,
      max: 1,
    });
  });
});
