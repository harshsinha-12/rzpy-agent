import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RecoveryWorkflow } from "./recovery-workflow";

describe("RecoveryWorkflow", () => {
  it("explains the reported-issue recovery loop and table mapping", () => {
    const markup = renderToStaticMarkup(<RecoveryWorkflow />);

    expect(markup).toContain(
      "Detect → Diagnose → Decide → Guard → Execute → Observe",
    );
    expect(markup).toContain("01 · Payment / case");
    expect(markup).toContain("Proposed action");
    expect(markup).toContain("Policy");
    expect(markup).toContain("Recovery state");
    expect(markup).toContain("AI can propose the next step");
  });
});
