import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { CheckoutDropOff } from "../schemas";
import { DropOffList } from "./dropoff-list";

const openDropOff: CheckoutDropOff = {
  amountPaise: 249_900,
  auditTimeline: [],
  caseId: "CO-SIM-1001",
  checkoutCreatedAt: "2026-08-31T08:00:00.000Z",
  currency: "INR",
  customer: {
    email: "priya.nair@example.com",
    name: "Priya Nair",
    optedOut: false,
  },
  dataSource: "SIMULATED",
  draftBody: null,
  draftSubject: null,
  orderId: "order_checkout_sim_1001",
  policyDecision: null,
  policyReason: null,
  paymentLinkUrl: null,
  status: "OPEN",
};

describe("DropOffList", () => {
  it("renders table columns, case facts, and a prepare action", () => {
    const markup = renderToStaticMarkup(
      createElement(DropOffList, { initialItems: [openDropOff] }),
    );

    expect(markup).toContain("Checkout");
    expect(markup).toContain("Customer");
    expect(markup).toContain("Amount");
    expect(markup).toContain("Draft status");
    expect(markup).toContain("Data source");
    expect(markup).toContain("Action");
    expect(markup).toContain("CO-SIM-1001");
    expect(markup).toContain("order_checkout_sim_1001");
    expect(markup).toContain("Priya Nair");
    expect(markup).toContain("₹2,499");
    expect(markup).toContain("Open");
    expect(markup).toContain("Awaiting merchant selection");
    expect(markup).toContain("SIMULATED DATA");
    expect(markup).toContain("Prepare email");
  });

  it("renders a useful empty state", () => {
    const markup = renderToStaticMarkup(
      createElement(DropOffList, { initialItems: [] }),
    );

    expect(markup).toContain("No unpaid checkouts yet");
    expect(markup).not.toContain("Prepare email");
  });
});
