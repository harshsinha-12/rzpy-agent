import { dataSources } from "@recoveryos/domain";
import { describe, expect, it } from "vitest";

import { buildSeedDataset } from "./scenarios.js";

describe("buildSeedDataset", () => {
  const dataset = buildSeedDataset(20260820);

  it("covers recovered, waiting, stopped, escalated, exhausted, and retry-failure cases", () => {
    const statuses = dataset.scenarios.map((scenario) => scenario.status);

    expect(statuses).toEqual(
      expect.arrayContaining([
        "RECOVERED",
        "WAITING",
        "STOPPED",
        "ESCALATED",
        "EXHAUSTED",
        "RECOVERY_RUNNING",
      ]),
    );
    expect(
      dataset.scenarios.some(
        (scenario) =>
          scenario.id === "case_rc1007" &&
          scenario.actions.filter(
            (action) => action.actionType === "CREATE_PAYMENT_LINK",
          ).length === 2,
      ),
    ).toBe(true);
  });

  it("labels every case and stores money as integer paise", () => {
    for (const scenario of dataset.scenarios) {
      expect(dataSources).toContain(scenario.dataSource);
      expect(Number.isInteger(scenario.amountAtRiskPaise)).toBe(true);
      expect(Number.isInteger(scenario.recoveredAmountPaise)).toBe(true);
      expect(scenario.amountAtRiskPaise % 100).toBe(0);
    }
  });

  it("keeps public IDs and payment IDs unique", () => {
    const publicIds = dataset.scenarios.map((scenario) => scenario.publicId);
    const paymentIds = dataset.scenarios.map(
      (scenario) => scenario.payment.razorpayPaymentId,
    );

    expect(new Set(publicIds).size).toBe(publicIds.length);
    expect(new Set(paymentIds).size).toBe(paymentIds.length);
  });

  it("is deterministic for the same seed", () => {
    const again = buildSeedDataset(20260820);

    expect(
      again.scenarios.map((scenario) => scenario.amountAtRiskPaise),
    ).toEqual(dataset.scenarios.map((scenario) => scenario.amountAtRiskPaise));
  });
});
