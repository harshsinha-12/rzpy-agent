import { describe, expect, it } from "vitest";

import { PAISA_PER_RUPEE } from "./constants.js";

describe("money constants", () => {
  it("stores rupees as integer paise", () => {
    expect(PAISA_PER_RUPEE).toBe(100);
    expect(Number.isInteger(4999 * PAISA_PER_RUPEE)).toBe(true);
  });
});
