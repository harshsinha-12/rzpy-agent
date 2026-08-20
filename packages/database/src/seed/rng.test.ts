import { describe, expect, it } from "vitest";

import { createRng, randomInt, rupeesToPaise } from "./rng.js";

describe("seeded rng", () => {
  it("reproduces the same sequence for a fixed seed", () => {
    const first = createRng(20260820);
    const second = createRng(20260820);

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("converts rupees to integer paise", () => {
    const rng = createRng(20260820);
    const paise = rupeesToPaise(randomInt(rng, 199, 4999));

    expect(Number.isInteger(paise)).toBe(true);
    expect(paise % 100).toBe(0);
  });
});
