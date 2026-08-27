import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  publicApiUrl: "https://api.example.com",
  publicWorkerHealthUrl: "https://worker.example.com",
}));

import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("links to API liveness, API readiness, and worker readiness", () => {
    const markup = renderToStaticMarkup(
      createElement(AppShell, null, createElement("p", null, "Content")),
    );

    expect(markup).toContain('href="https://api.example.com/health/live"');
    expect(markup).toContain('href="https://api.example.com/health"');
    expect(markup).toContain('href="https://worker.example.com/health"');
    expect(markup).toContain("API live");
    expect(markup).toContain("API ready");
  });
});
