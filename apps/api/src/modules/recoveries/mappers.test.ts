import { describe, expect, it } from "vitest";

import { mapRecoveryCaseDetail } from "./mappers.js";
import type { RecoveryCaseDetailRecord } from "./types.js";

function detailRecord(): RecoveryCaseDetailRecord {
  const occurredAt = new Date("2026-08-21T08:00:00.000Z");

  return {
    actions: [],
    amountAtRiskPaise: 499_900,
    auditEvents: [
      {
        actionId: null,
        actor: "DIAGNOSIS_ENGINE",
        dataSource: "RAZORPAY_TEST_MODE",
        decision: "GATEWAY_TRANSIENT",
        eventType: "diagnosis.completed",
        id: "audit_diagnosis_test",
        input: { errorReason: "gateway_timeout" },
        occurredAt,
        output: {
          customerContactAllowed: false,
          evidence: [
            {
              explanation: "Normalized failure reason",
              signal: "ERROR_REASON",
              value: "gateway_timeout",
            },
          ],
          recommendedAction: "WAIT",
        },
        reasoning: "A gateway timeout is likely transient.",
      },
    ],
    closedAt: null,
    currency: "INR",
    customer: {
      dataSource: "RAZORPAY_TEST_MODE",
      externalRef: "customer_test",
      name: "Test customer",
      optedOut: false,
    },
    dataSource: "RAZORPAY_TEST_MODE",
    diagnosis: "A gateway timeout is likely transient.",
    failureCategory: "GATEWAY_TRANSIENT",
    id: "case_test_diagnosis",
    lastUpdatedAt: occurredAt,
    openedAt: occurredAt,
    paymentEvent: {
      amountPaise: 499_900,
      currency: "INR",
      errorCode: "GATEWAY_ERROR",
      errorDescription: "The gateway timed out.",
      errorReason: "gateway_timeout",
      errorSource: "gateway",
      errorStep: "payment_processing",
      eventType: "payment.failed",
      occurredAt,
      paymentMethod: "UPI",
      razorpayOrderId: "order_test_diagnosis",
      razorpayPaymentId: "pay_test_diagnosis",
      status: "FAILED",
    },
    publicId: "RC-TM-DIAGNOSIS",
    recoverabilityBand: "HIGH",
    recoverabilityScore: 86,
    recoveredAmountPaise: 0,
    status: "ACTION_REQUIRED",
  };
}

describe("mapRecoveryCaseDetail", () => {
  it("exposes stored diagnosis evidence and the pre-policy next step", () => {
    const mapped = mapRecoveryCaseDetail(detailRecord());

    expect(mapped).toMatchObject({
      customerContactAllowed: false,
      diagnosisEvidence: [
        {
          signal: "ERROR_REASON",
          value: "gateway_timeout",
        },
      ],
      recommendedAction: "WAIT",
    });
  });
});
