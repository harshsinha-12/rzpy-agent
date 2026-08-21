import { describe, expect, it } from "vitest";

import { mapRecoveryCaseDetail } from "./mappers.js";
import type { RecoveryCaseDetailRecord } from "./types.js";

function detailRecord(): RecoveryCaseDetailRecord {
  const occurredAt = new Date("2026-08-21T08:00:00.000Z");

  return {
    actions: [
      {
        actionType: "SEND_REMINDER",
        attemptNumber: 1,
        confidence: 25,
        createdAt: occurredAt,
        dataSource: "RAZORPAY_TEST_MODE",
        executedAt: null,
        id: "action_test_policy",
        input: {
          evidence: ["Error source is business"],
          model: "gpt-5.6-terra",
          source: "OPENAI",
        },
        output: {
          safeFallbackAction: "ESCALATE",
          violations: [
            {
              code: "MERCHANT_FAILURE",
              message: "Merchant failures must not contact the customer.",
            },
          ],
        },
        policyDecision: "DENIED",
        policyReason: "Merchant failures must not contact the customer.",
        proposedBy: "RECOVERY_AGENT",
        razorpayReference: null,
        reason: "Ask the customer to retry.",
        result: "SKIPPED",
        scheduledFor: null,
      },
    ],
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
    expect(mapped.actions[0]).toMatchObject({
      policyViolations: [
        {
          code: "MERCHANT_FAILURE",
        },
      ],
      proposalEvidence: ["Error source is business"],
      proposalModel: "gpt-5.6-terra",
      proposalSource: "OPENAI",
      safeFallbackAction: "ESCALATE",
    });
  });
});
