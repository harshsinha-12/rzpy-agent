import { describe, expect, it } from "vitest";

import {
  formatDateTime,
  formatLabel,
  formatMoney,
  formatPercentage,
} from "./formatters";

describe("frontend formatters", () => {
  it("formats paise as Indian rupees", () => {
    expect(formatMoney(125_000)).toBe("₹1,250");
  });

  it("turns enum values into readable labels", () => {
    expect(formatLabel("RECOVERY_RUNNING")).toBe("Recovery Running");
  });

  it("formats basis points without unnecessary decimals", () => {
    expect(formatPercentage(4_500)).toBe("45%");
    expect(formatPercentage(4_550)).toBe("45.5%");
  });

  it("returns a stable Indian date and time label", () => {
    expect(formatDateTime("2026-08-20T10:30:00.000Z")).toContain("20 Aug 2026");
  });
});
