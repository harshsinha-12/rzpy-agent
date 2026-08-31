import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  frozenSimulationProof,
  landingHero,
  recoveryLoopStages,
  safetyStrip,
  testModeProof,
} from "../content";
import { LandingPage } from "./landing-page";
import { MarketingShell } from "./marketing-shell";

describe("LandingPage", () => {
  it("explains RecoveryOS with CTAs and the six-stage loop", () => {
    const markup = renderToStaticMarkup(createElement(LandingPage));

    expect(markup).toContain(landingHero.brand);
    expect(markup).toContain(landingHero.problem);
    expect(markup).toContain(landingHero.promise);
    expect(markup).toContain(landingHero.ctaPrimary);
    expect(markup).toContain(landingHero.ctaSecondary);
    expect(markup).toContain('href="/dashboard"');
    expect(markup).toContain('href="/demo/checkout"');

    for (const stage of recoveryLoopStages) {
      expect(markup).toContain(stage.title);
    }

    expect(markup).toContain(
      "Detect → Diagnose → Propose → Guard → Execute → Verify",
    );
    expect(markup).toContain(safetyStrip.title);
    expect(markup).toContain(frozenSimulationProof.label);
    expect(markup).toContain(testModeProof.label);
    expect(markup).toContain(frozenSimulationProof.configurationHash);
    expect(markup).not.toContain("API live");
    expect(markup).not.toContain("API ready");
    expect(markup).not.toContain("Worker");
  });
});

describe("MarketingShell", () => {
  it("links to the dashboard without operator health chrome", () => {
    const markup = renderToStaticMarkup(
      createElement(MarketingShell, null, createElement("p", null, "Landing")),
    );

    expect(markup).toContain('href="/dashboard"');
    expect(markup).toContain("Open dashboard");
    expect(markup).toContain('href="/about"');
    expect(markup).toContain('href="/demo/checkout"');
    expect(markup).not.toContain("API live");
    expect(markup).not.toContain("/health/live");
    expect(markup).not.toContain("Worker");
  });
});
