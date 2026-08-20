import { describe, expect, it } from "vitest";

import { processSystemHealthJob } from "./system-health.js";

describe("processSystemHealthJob", () => {
  it("returns a readiness result", async () => {
    const result = await processSystemHealthJob();

    expect(result.worker).toBe("ready");
    expect(Number.isNaN(Date.parse(result.processedAt))).toBe(false);
  });
});
