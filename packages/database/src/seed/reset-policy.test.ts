import { describe, expect, it } from "vitest";

import {
  assertDemoSeedAllowed,
  PRODUCTION_DEMO_RESET_CONFIRMATION,
} from "./reset-policy.js";

describe("assertDemoSeedAllowed", () => {
  it("allows non-production seeds without confirmation", () => {
    expect(() =>
      assertDemoSeedAllowed({ confirmation: undefined, nodeEnv: "test" }),
    ).not.toThrow();
    expect(() =>
      assertDemoSeedAllowed({ confirmation: undefined, nodeEnv: undefined }),
    ).not.toThrow();
  });

  it("blocks an accidental production reset", () => {
    expect(() =>
      assertDemoSeedAllowed({
        confirmation: undefined,
        nodeEnv: "production",
      }),
    ).toThrow("Production demo reset blocked");
  });

  it("allows an explicitly confirmed production reset", () => {
    expect(() =>
      assertDemoSeedAllowed({
        confirmation: PRODUCTION_DEMO_RESET_CONFIRMATION,
        nodeEnv: "production",
      }),
    ).not.toThrow();
  });
});
