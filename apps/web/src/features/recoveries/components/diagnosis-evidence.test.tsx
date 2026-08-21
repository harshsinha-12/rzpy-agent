import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DiagnosisEvidence } from "./diagnosis-evidence";

describe("DiagnosisEvidence", () => {
  it("shows the signals and customer-contact guardrail", () => {
    const markup = renderToStaticMarkup(
      createElement(DiagnosisEvidence, {
        customerContactAllowed: false,
        evidence: [
          {
            explanation: "Razorpay failure origin",
            signal: "ERROR_SOURCE",
            value: "business",
          },
          {
            explanation: "Deterministic category",
            signal: "CLASSIFICATION_RULE",
            value: "MERCHANT_ERROR",
          },
        ],
      }),
    );

    expect(markup).toContain("Customer Contact Avoided");
    expect(markup).toContain("Error Source");
    expect(markup).toContain("Merchant Error");
  });
});
