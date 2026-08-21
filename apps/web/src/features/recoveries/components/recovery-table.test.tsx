import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { parseRecoveryQuery } from "../query";
import type { RecoveryCaseListItem } from "../schemas";
import { RecoveryTable } from "./recovery-table";

const recoveryCase: RecoveryCaseListItem = {
  amountAtRiskPaise: 125_000,
  caseId: "RC-1001",
  currency: "INR",
  dataSource: "SIMULATED",
  diagnosis: "Issuer declined the card payment.",
  failureCategory: "ISSUER_FAILURE",
  failureDescription: "Payment was declined",
  failureReason: "ISSUER_DECLINED",
  failureSource: "BANK",
  lastUpdatedAt: "2026-08-20T10:30:00.000Z",
  openedAt: "2026-08-20T10:00:00.000Z",
  orderId: "order_sim_1001",
  paymentId: "pay_sim_1001",
  paymentMethod: "CARD",
  paymentStatus: "FAILED",
  policyDecision: "APPROVED",
  proposedAction: "WAIT",
  recoverabilityBand: "HIGH",
  recoverabilityScore: 88,
  recoveredAmountPaise: 125_000,
  recoveryStatus: "RECOVERED",
};

describe("RecoveryTable", () => {
  it("renders the report fields and visible simulated-data label", () => {
    const markup = renderToStaticMarkup(
      createElement(RecoveryTable, {
        items: [recoveryCase],
        query: parseRecoveryQuery({}),
      }),
    );

    expect(markup).toContain("Payment / case");
    expect(markup).toContain("Proposed action");
    expect(markup).toContain("pay_sim_1001");
    expect(markup).toContain("Wait");
    expect(markup).toContain("SIMULATED DATA");
  });

  it("renders a useful empty state", () => {
    const markup = renderToStaticMarkup(
      createElement(RecoveryTable, {
        items: [],
        query: parseRecoveryQuery({}),
      }),
    );

    expect(markup).toContain("No recovery cases match these filters");
  });
});
