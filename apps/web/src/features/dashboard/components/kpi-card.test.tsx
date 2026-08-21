import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KpiCard } from "./kpi-card";

describe("KpiCard", () => {
  it("renders its metric, value, and calculation hint", () => {
    const markup = renderToStaticMarkup(
      createElement(KpiCard, {
        hint: "Recovered value divided by value at risk",
        label: "Recovery rate",
        positive: true,
        value: "48.5%",
      }),
    );

    expect(markup).toContain("Recovery rate");
    expect(markup).toContain("48.5%");
    expect(markup).toContain("Recovered value divided by value at risk");
  });
});
