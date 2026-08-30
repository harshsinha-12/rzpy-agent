import type { FailureCategory } from "@recoveryos/domain";
import { describe, expect, it } from "vitest";

import { diagnosePaymentFailure } from "./diagnose.js";
import type { DiagnosisInput } from "./types.js";

describe("diagnosePaymentFailure", () => {
  const cases: Array<{
    category: FailureCategory;
    input: DiagnosisInput;
  }> = [
    {
      category: "MERCHANT_ERROR",
      input: {
        attemptCount: 1,
        errorReason: "payment_method_disabled",
        errorSource: "business",
        errorStep: "payment_initiation",
        method: "CARD",
      },
    },
    {
      category: "CUSTOMER_AUTH",
      input: {
        attemptCount: 1,
        errorReason: "incorrect_otp",
        errorSource: "customer",
        errorStep: "authentication",
        method: "CARD",
      },
    },
    {
      category: "INSUFFICIENT_FUNDS",
      input: {
        attemptCount: 1,
        errorReason: "insufficient_funds",
        errorSource: "customer",
        method: "UPI",
      },
    },
    {
      category: "GATEWAY_TRANSIENT",
      input: {
        attemptCount: 1,
        errorCode: "GATEWAY_ERROR",
        errorReason: "gateway_timeout",
        errorSource: "gateway",
        method: "UPI",
      },
    },
    {
      category: "NETWORK_ERROR",
      input: {
        attemptCount: 1,
        errorReason: "network_timeout",
        errorSource: "network",
        method: "NETBANKING",
      },
    },
    {
      category: "ISSUER_FAILURE",
      input: {
        attemptCount: 1,
        errorCode: "GATEWAY_ERROR",
        errorReason: "issuer_declined",
        errorSource: "bank",
        method: "CARD",
      },
    },
  ];

  it.each(cases)(
    "classifies $category from known signals",
    ({ category, input }) => {
      const result = diagnosePaymentFailure(input);

      expect(result.category).toBe(category);
      expect(result.evidence).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            signal: "CLASSIFICATION_RULE",
            value: category,
          }),
        ]),
      );
    },
  );

  it("falls back to UNKNOWN and WAIT for an unrecognized first attempt", () => {
    const result = diagnosePaymentFailure({
      attemptCount: 1,
      errorReason: "something_new",
      errorSource: "other",
      method: "UNKNOWN",
    });

    expect(result).toMatchObject({
      category: "UNKNOWN",
      customerContactAllowed: false,
      recommendedAction: "WAIT",
      recoverabilityBand: "LOW",
    });
  });

  it("escalates repeated unknown failures instead of guessing", () => {
    const result = diagnosePaymentFailure({
      attemptCount: 3,
      errorReason: null,
      errorSource: null,
      method: "UNKNOWN",
    });

    expect(result).toMatchObject({
      category: "UNKNOWN",
      recommendedAction: "ESCALATE",
      recoverabilityBand: "NONE",
      recoverabilityScore: 0,
    });
  });

  it("offers a fresh payment link after customer authentication fails", () => {
    const result = diagnosePaymentFailure({
      attemptCount: 1,
      errorReason: "payment_cancelled",
      errorSource: "customer",
      errorStep: "payment_authentication",
      method: "CARD",
    });

    expect(result).toMatchObject({
      category: "CUSTOMER_AUTH",
      customerContactAllowed: true,
      recommendedAction: "CREATE_PAYMENT_LINK",
    });
  });

  it("never recommends customer contact for merchant failures", () => {
    const result = diagnosePaymentFailure({
      attemptCount: 2,
      errorReason: "merchant_not_configured",
      errorSource: "business",
      method: "UPI",
    });

    expect(result.category).toBe("MERCHANT_ERROR");
    expect(result.customerContactAllowed).toBe(false);
    expect(result.recommendedAction).toBe("ESCALATE");
    expect(["CREATE_PAYMENT_LINK", "SEND_REMINDER"]).not.toContain(
      result.recommendedAction,
    );
  });

  it("reduces recoverability as repeated attempts fail", () => {
    const first = diagnosePaymentFailure({
      attemptCount: 1,
      errorReason: "gateway_timeout",
      errorSource: "gateway",
      method: "UPI",
    });
    const third = diagnosePaymentFailure({
      attemptCount: 3,
      errorReason: "gateway_timeout",
      errorSource: "gateway",
      method: "UPI",
    });

    expect(third.recoverabilityScore).toBeLessThan(first.recoverabilityScore);
  });
});
