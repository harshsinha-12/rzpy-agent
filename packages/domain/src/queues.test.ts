import { describe, expect, it } from "vitest";

import { analysisJobId, executeJobId, verifyJobId } from "./queues.js";

describe("BullMQ stable job IDs", () => {
  it.each([
    ["analysis", analysisJobId, "case-123", "analyse-case-123"],
    ["execution", executeJobId, "action-123", "execute-action-123"],
    ["verification", verifyJobId, "action-123", "verify-action-123"],
  ])("creates a colon-free %s ID", (_label, buildId, input, expected) => {
    const jobId = buildId(input);

    expect(jobId).toBe(expected);
    expect(jobId).not.toContain(":");
  });
});
