import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  finalCallToAction,
  frozenSimulationProof,
  landingHero,
  operatingLayers,
  productDifference,
  recoveryScenarios,
  recoveryLoopStages,
  safetyStrip,
  testModeProof,
} from "../content";
import { LandingPage } from "./landing-page";
import { MarketingShell } from "./marketing-shell";

describe("LandingPage", () => {
  it("explains RecoveryOS with CTAs and the six-stage loop", () => {
    const markup = renderToStaticMarkup(createElement(LandingPage));

    expect(markup).toContain(landingHero.problemLead);
    expect(markup).toContain(landingHero.problemEmphasis);
    expect(markup).toContain(landingHero.promise);
    expect(markup).toContain(landingHero.ctaPrimary);
    expect(markup).toContain(landingHero.ctaSecondary);
    expect(markup).toContain('href="/dashboard"');
    expect(markup).toContain('href="/demo/checkout"');

    for (const stage of recoveryLoopStages) {
      expect(markup).toContain(stage.title);
    }

    for (const difference of productDifference) {
      expect(markup).toContain(difference.title);
    }

    for (const layer of operatingLayers) {
      expect(markup).toContain(layer.title);
    }

    for (const scenario of recoveryScenarios) {
      expect(markup).toContain(scenario);
    }

    expect(markup).toContain(safetyStrip.title);
    expect(markup).toContain(finalCallToAction.title);
    expect(markup).toContain(frozenSimulationProof.label);
    expect(markup).toContain(testModeProof.label.replaceAll("_", " "));
    expect(markup).toContain(frozenSimulationProof.configurationHash);
    expect(markup).toContain("No intervention");
    expect(markup).toContain("Naive immediate retry");
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
