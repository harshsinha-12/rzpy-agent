import { describe, expect, it } from "vitest";

import {
  productionWorkerHealthUrl,
  resolveWorkerHealthUrl,
} from "./health-urls";

describe("resolveWorkerHealthUrl", () => {
  it("uses the configured /health URL as the Worker href", () => {
    expect(resolveWorkerHealthUrl(productionWorkerHealthUrl)).toBe(
      productionWorkerHealthUrl,
    );
  });

  it("adds /health when the env value is only the worker origin", () => {
    expect(
      resolveWorkerHealthUrl(
        "https://recoveryosworker-production.up.railway.app",
      ),
    ).toBe(productionWorkerHealthUrl);
  });

  it("falls back to the production worker health URL when the hostname is truncated", () => {
    expect(resolveWorkerHealthUrl("https://recoveryosworker-")).toBe(
      productionWorkerHealthUrl,
    );
  });

  it("keeps the local worker health URL for development", () => {
    expect(resolveWorkerHealthUrl("http://localhost:4001/health")).toBe(
      "http://localhost:4001/health",
    );
  });
});
