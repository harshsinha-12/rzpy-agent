import { describe, expect, it } from "vitest";

import { delayUntil } from "./job-options.js";

describe("delayUntil", () => {
  it("returns a non-negative delay for future timestamps", () => {
    const now = new Date("2026-08-21T10:00:00.000Z");
    expect(delayUntil(new Date("2026-08-21T10:05:00.000Z"), now)).toBe(300_000);
    expect(delayUntil(new Date("2026-08-21T09:00:00.000Z"), now)).toBe(0);
    expect(delayUntil(null, now)).toBe(0);
  });
});
