import { describe, expect, it } from "vitest";

import { resolveRedisUrl } from "./redis-url.js";

describe("resolveRedisUrl", () => {
  it("uses the canonical URL when one is configured", () => {
    expect(
      resolveRedisUrl({
        REDIS_HOST: "ignored.example.com",
        REDIS_URL: "rediss://default:secret@redis.example.com:16379",
      }),
    ).toBe("rediss://default:secret@redis.example.com:16379");
  });

  it("builds an encoded URL from managed Redis component variables", () => {
    expect(
      resolveRedisUrl({
        REDIS_HOST: "redis.example.com",
        REDIS_PASSWORD: "password@with:symbols",
        REDIS_PORT: 16_158,
        REDIS_USERNAME: "default",
      }),
    ).toBe("redis://default:password%40with%3Asymbols@redis.example.com:16158");
  });

  it("uses rediss when TLS is enabled", () => {
    expect(
      resolveRedisUrl({
        REDIS_HOST: "redis.example.com",
        REDIS_PASSWORD: "secret",
        REDIS_PORT: 16_379,
        REDIS_TLS: true,
      }),
    ).toBe("rediss://default:secret@redis.example.com:16379");
  });

  it("falls back to the local development URL", () => {
    expect(resolveRedisUrl({})).toBe("redis://localhost:6380");
  });

  it("rejects incomplete component credentials", () => {
    expect(() => resolveRedisUrl({ REDIS_HOST: "redis.example.com" })).toThrow(
      "REDIS_PASSWORD",
    );
  });
});
