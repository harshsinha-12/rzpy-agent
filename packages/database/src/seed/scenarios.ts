import {
  actionTypes,
  DEFAULT_DEMO_SEED,
  DEMO_MERCHANT_NAME,
  DEMO_MERCHANT_SLUG,
  PAISA_PER_RUPEE,
} from "@recoveryos/domain";

import { createRng, randomInt, rupeesToPaise } from "./rng.js";
import type {
  SeedAuditEvent,
  SeedCustomer,
  SeedDataset,
  SeedPaymentEvent,
  SeedRecoveryAction,
  SeedScenario,
} from "./types.js";

const SEED_CLOCK = new Date("2026-08-20T11:00:00.000Z");
const MERCHANT_ID = "merchant_aurora_retail";

function atMinutes(offsetMinutes: number): Date {
  return new Date(SEED_CLOCK.getTime() + offsetMinutes * 60_000);
}

function rupeeRange(
  rng: () => number,
  minRupees: number,
  maxRupees: number,
): number {
  return rupeesToPaise(randomInt(rng, minRupees, maxRupees));
}

function paymentPayload(payment: {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  amountPaise: number;
  method: string;
  status: string;
  errorCode: string | null;
  errorSource: string | null;
  errorStep: string | null;
  errorReason: string | null;
  errorDescription: string | null;
}): Record<string, unknown> {
  return {
    event:
      payment.status === "captured" ? "payment.captured" : "payment.failed",
    payload: {
      payment: {
        entity: {
          amount: payment.amountPaise,
          currency: "INR",
          error_code: payment.errorCode,
          error_description: payment.errorDescription,
          error_reason: payment.errorReason,
          error_source: payment.errorSource,
          error_step: payment.errorStep,
          id: payment.razorpayPaymentId,
          method: payment.method.toLowerCase(),
          order_id: payment.razorpayOrderId,
          status: payment.status,
        },
      },
    },
  };
}

function idempotencyKey(
  razorpayPaymentId: string,
  actionType: string,
  attemptNumber: number,
): string {
  return `recovery:${razorpayPaymentId}:${actionType}:${attemptNumber}`;
}

const customers: SeedCustomer[] = [
  {
    email: "priya.nair@example.com",
    externalRef: "cust_priya_nair",
    id: "customer_priya_nair",
    name: "Priya Nair",
    optedOut: false,
    phone: "+919000000001",
  },
  {
    email: "arjun.mehta@example.com",
    externalRef: "cust_arjun_mehta",
    id: "customer_arjun_mehta",
    name: "Arjun Mehta",
    optedOut: false,
    phone: "+919000000002",
  },
  {
    email: "kabir.shah@example.com",
    externalRef: "cust_kabir_shah",
    id: "customer_kabir_shah",
    name: "Kabir Shah",
    optedOut: false,
    phone: "+919000000003",
  },
  {
    email: "meera.iyer@example.com",
    externalRef: "cust_meera_iyer",
    id: "customer_meera_iyer",
    name: "Meera Iyer",
    optedOut: false,
    phone: "+919000000004",
  },
  {
    email: "ravi.kulkarni@example.com",
    externalRef: "cust_ravi_kulkarni",
    id: "customer_ravi_kulkarni",
    name: "Ravi Kulkarni",
    optedOut: false,
    phone: "+919000000005",
  },
  {
    email: "ananya.das@example.com",
    externalRef: "cust_ananya_das",
    id: "customer_ananya_das",
    name: "Ananya Das",
    optedOut: false,
    phone: "+919000000006",
  },
  {
    email: "neha.bansal@example.com",
    externalRef: "cust_neha_bansal",
    id: "customer_neha_bansal",
    name: "Neha Bansal",
    optedOut: false,
    phone: "+919000000007",
  },
];

function failedPayment(options: {
  amountPaise: number;
  customerId: string;
  errorCode: string;
  errorDescription: string;
  errorReason: string;
  errorSource: string;
  errorStep: string;
  id: string;
  method: SeedPaymentEvent["paymentMethod"];
  occurredAt: Date;
  suffix: string;
}): SeedPaymentEvent {
  const razorpayPaymentId = `pay_sim_${options.suffix}`;
  const razorpayOrderId = `order_sim_${options.suffix}`;

  return {
    amountPaise: options.amountPaise,
    customerId: options.customerId,
    errorCode: options.errorCode,
    errorDescription: options.errorDescription,
    errorReason: options.errorReason,
    errorSource: options.errorSource,
    errorStep: options.errorStep,
    eventType: "payment.failed",
    id: options.id,
    occurredAt: options.occurredAt,
    paymentMethod: options.method,
    razorpayOrderId,
    razorpayPaymentId,
    rawPayload: paymentPayload({
      amountPaise: options.amountPaise,
      errorCode: options.errorCode,
      errorDescription: options.errorDescription,
      errorReason: options.errorReason,
      errorSource: options.errorSource,
      errorStep: options.errorStep,
      method: options.method,
      razorpayOrderId,
      razorpayPaymentId,
      status: "failed",
    }),
    status: "FAILED",
  };
}

function action(options: SeedRecoveryAction): SeedRecoveryAction {
  return options;
}

function audit(options: SeedAuditEvent): SeedAuditEvent {
  return options;
}

function buildScenarios(rng: () => number): SeedScenario[] {
  const gatewayTimeout = failedPayment({
    amountPaise: 4999 * PAISA_PER_RUPEE,
    customerId: "customer_priya_nair",
    errorCode: "GATEWAY_ERROR",
    errorDescription: "The downstream gateway timed out.",
    errorReason: "gateway_timeout",
    errorSource: "gateway",
    errorStep: "payment_processing",
    id: "payment_rc1001",
    method: "UPI",
    occurredAt: atMinutes(-90),
    suffix: "rc1001",
  });

  const insufficientFunds = failedPayment({
    amountPaise: rupeeRange(rng, 899, 2499),
    customerId: "customer_arjun_mehta",
    errorCode: "BAD_REQUEST_ERROR",
    errorDescription: "The customer account did not have sufficient funds.",
    errorReason: "insufficient_funds",
    errorSource: "customer",
    errorStep: "payment_processing",
    id: "payment_rc1002",
    method: "UPI",
    occurredAt: atMinutes(-70),
    suffix: "rc1002",
  });

  const incorrectOtp = failedPayment({
    amountPaise: rupeeRange(rng, 499, 1999),
    customerId: "customer_kabir_shah",
    errorCode: "BAD_REQUEST_ERROR",
    errorDescription: "The customer entered an incorrect OTP.",
    errorReason: "incorrect_otp",
    errorSource: "customer",
    errorStep: "payment_authentication",
    id: "payment_rc1003",
    method: "CARD",
    occurredAt: atMinutes(-55),
    suffix: "rc1003",
  });

  const merchantError = failedPayment({
    amountPaise: rupeeRange(rng, 2999, 15999),
    customerId: "customer_meera_iyer",
    errorCode: "BAD_REQUEST_ERROR",
    errorDescription: "The merchant integration rejected the payment request.",
    errorReason: "invalid_request",
    errorSource: "business",
    errorStep: "payment_initiation",
    id: "payment_rc1004",
    method: "NETBANKING",
    occurredAt: atMinutes(-50),
    suffix: "rc1004",
  });

  const repeatedFailure = failedPayment({
    amountPaise: rupeeRange(rng, 299, 799),
    customerId: "customer_ravi_kulkarni",
    errorCode: "BAD_REQUEST_ERROR",
    errorDescription: "The customer authentication failed repeatedly.",
    errorReason: "authentication_failed",
    errorSource: "customer",
    errorStep: "payment_authentication",
    id: "payment_rc1005",
    method: "CARD",
    occurredAt: atMinutes(-40),
    suffix: "rc1005",
  });

  const issuerFailure = failedPayment({
    amountPaise: rupeeRange(rng, 4999, 9999),
    customerId: "customer_ananya_das",
    errorCode: "GATEWAY_ERROR",
    errorDescription: "The issuer declined the payment.",
    errorReason: "issuer_declined",
    errorSource: "issuer",
    errorStep: "payment_authorization",
    id: "payment_rc1006",
    method: "CARD",
    occurredAt: atMinutes(-35),
    suffix: "rc1006",
  });

  const retryFailure = failedPayment({
    amountPaise: rupeeRange(rng, 1499, 3999),
    customerId: "customer_neha_bansal",
    errorCode: "GATEWAY_ERROR",
    errorDescription: "A transient Razorpay API error interrupted recovery.",
    errorReason: "gateway_timeout",
    errorSource: "razorpay",
    errorStep: "payment_processing",
    id: "payment_rc1007",
    method: "UPI",
    occurredAt: atMinutes(-25),
    suffix: "rc1007",
  });

  return [
    {
      actions: [
        action({
          actionType: "WAIT",
          attemptNumber: 1,
          confidence: 87,
          createdAt: atMinutes(-89),
          executedAt: atMinutes(-89),
          id: "action_rc1001_wait",
          input: { delayMinutes: 5 },
          output: { waitedUntil: atMinutes(-84).toISOString() },
          policyDecision: "APPROVED",
          policyReason:
            "No recent customer contact and the failure is retryable.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason:
            "Transient gateway timeout. Immediate customer contact is unnecessary.",
          result: "SUCCEEDED",
          scheduledFor: atMinutes(-84),
        }),
        action({
          actionType: "CREATE_PAYMENT_LINK",
          attemptNumber: 1,
          confidence: 81,
          createdAt: atMinutes(-84),
          executedAt: atMinutes(-83),
          id: "action_rc1001_link",
          input: { expiresInMinutes: 30 },
          output: { paymentLinkId: "plink_sim_rc1001" },
          policyDecision: "APPROVED",
          policyReason: "Attempts remaining and the recovery window is open.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: "plink_sim_rc1001",
          reason:
            "Payment still failed after cooldown, so a new payment opportunity was created.",
          result: "SUCCEEDED",
          scheduledFor: atMinutes(-84),
        }),
      ],
      amountAtRiskPaise: gatewayTimeout.amountPaise,
      auditEvents: [
        audit({
          actionId: null,
          actor: "WEBHOOK",
          decision: null,
          eventType: "payment.failed.received",
          id: "audit_rc1001_webhook",
          input: { razorpayPaymentId: gatewayTimeout.razorpayPaymentId },
          occurredAt: atMinutes(-90),
          output: null,
          reasoning: "Razorpay reported a failed UPI payment.",
        }),
        audit({
          actionId: null,
          actor: "DIAGNOSIS_ENGINE",
          decision: "GATEWAY_TRANSIENT",
          eventType: "diagnosis.completed",
          id: "audit_rc1001_diagnosis",
          input: { errorReason: "gateway_timeout" },
          occurredAt: atMinutes(-89),
          output: { recoverabilityBand: "HIGH" },
          reasoning: "Gateway timeout during processing is usually transient.",
        }),
        audit({
          actionId: "action_rc1001_wait",
          actor: "POLICY_ENGINE",
          decision: "APPROVED",
          eventType: "policy.decision",
          id: "audit_rc1001_policy_wait",
          input: { actionType: "WAIT" },
          occurredAt: atMinutes(-89),
          output: null,
          reasoning: "WAIT is allowed and does not contact the customer.",
        }),
        audit({
          actionId: "action_rc1001_link",
          actor: "EXECUTION_LAYER",
          decision: "SUCCEEDED",
          eventType: "action.executed",
          id: "audit_rc1001_link_executed",
          input: { actionType: "CREATE_PAYMENT_LINK" },
          occurredAt: atMinutes(-83),
          output: { razorpayReference: "plink_sim_rc1001" },
          reasoning: "Payment remained failed after cooldown.",
        }),
        audit({
          actionId: null,
          actor: "WEBHOOK",
          decision: "RECOVERED",
          eventType: "payment.captured.received",
          id: "audit_rc1001_captured",
          input: { razorpayPaymentId: "pay_sim_rc1001_recovered" },
          occurredAt: atMinutes(-40),
          output: { recoveredAmountPaise: gatewayTimeout.amountPaise },
          reasoning: "The customer completed the recovery payment link.",
        }),
      ],
      closedAt: atMinutes(-40),
      customerId: gatewayTimeout.customerId,
      dataSource: "SIMULATED",
      diagnosis:
        "Transient gateway timeout with high recoverability after a short cooldown.",
      failureCategory: "GATEWAY_TRANSIENT",
      id: "case_rc1001",
      lastUpdatedAt: atMinutes(-40),
      openedAt: atMinutes(-90),
      payment: gatewayTimeout,
      publicId: "RC-1001",
      recoverabilityBand: "HIGH",
      recoverabilityScore: 87,
      recoveredAmountPaise: gatewayTimeout.amountPaise,
      status: "RECOVERED",
    },
    {
      actions: [
        action({
          actionType: "WAIT",
          attemptNumber: 1,
          confidence: 74,
          createdAt: atMinutes(-69),
          executedAt: atMinutes(-69),
          id: "action_rc1002_wait",
          input: { delayMinutes: 180 },
          output: null,
          policyDecision: "APPROVED",
          policyReason: "Immediate retry has low value for insufficient funds.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason:
            "Delay intervention until a later payment opportunity is more likely to succeed.",
          result: "SUCCEEDED",
          scheduledFor: atMinutes(110),
        }),
        action({
          actionType: "CREATE_PAYMENT_LINK",
          attemptNumber: 1,
          confidence: 68,
          createdAt: atMinutes(-68),
          executedAt: null,
          id: "action_rc1002_link",
          input: { expiresInMinutes: 30 },
          output: null,
          policyDecision: "APPROVED",
          policyReason:
            "A delayed payment link is within attempt and message limits.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason: "Create a recovery payment path after the cooldown.",
          result: "PENDING",
          scheduledFor: atMinutes(110),
        }),
      ],
      amountAtRiskPaise: insufficientFunds.amountPaise,
      auditEvents: [
        audit({
          actionId: null,
          actor: "DIAGNOSIS_ENGINE",
          decision: "INSUFFICIENT_FUNDS",
          eventType: "diagnosis.completed",
          id: "audit_rc1002_diagnosis",
          input: { errorReason: "insufficient_funds" },
          occurredAt: atMinutes(-69),
          output: { recoverabilityBand: "MEDIUM" },
          reasoning:
            "Immediate retry is unlikely until the customer has funds again.",
        }),
      ],
      closedAt: null,
      customerId: insufficientFunds.customerId,
      dataSource: "SIMULATED",
      diagnosis: "Insufficient funds. Delayed payment link is scheduled.",
      failureCategory: "INSUFFICIENT_FUNDS",
      id: "case_rc1002",
      lastUpdatedAt: atMinutes(-68),
      openedAt: atMinutes(-70),
      payment: insufficientFunds,
      publicId: "RC-1002",
      recoverabilityBand: "MEDIUM",
      recoverabilityScore: 64,
      recoveredAmountPaise: 0,
      status: "WAITING",
    },
    {
      actions: [
        action({
          actionType: "WAIT",
          attemptNumber: 1,
          confidence: 79,
          createdAt: atMinutes(-54),
          executedAt: atMinutes(-54),
          id: "action_rc1003_wait",
          input: { delayMinutes: 0 },
          output: { customerRetried: true },
          policyDecision: "APPROVED",
          policyReason:
            "Customer-action failures should not generate delayed reminder spam.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason: "Allow another immediate attempt after an incorrect OTP.",
          result: "SUCCEEDED",
          scheduledFor: atMinutes(-54),
        }),
      ],
      amountAtRiskPaise: incorrectOtp.amountPaise,
      auditEvents: [
        audit({
          actionId: "action_rc1003_wait",
          actor: "WEBHOOK",
          decision: "RECOVERED",
          eventType: "payment.captured.received",
          id: "audit_rc1003_captured",
          input: { razorpayPaymentId: "pay_sim_rc1003_recovered" },
          occurredAt: atMinutes(-48),
          output: { recoveredAmountPaise: incorrectOtp.amountPaise },
          reasoning: "The customer retried successfully after the OTP failure.",
        }),
      ],
      closedAt: atMinutes(-48),
      customerId: incorrectOtp.customerId,
      dataSource: "SIMULATED",
      diagnosis:
        "Incorrect OTP. Customer retry recovered the payment without extra reminders.",
      failureCategory: "CUSTOMER_AUTH",
      id: "case_rc1003",
      lastUpdatedAt: atMinutes(-48),
      openedAt: atMinutes(-55),
      payment: incorrectOtp,
      publicId: "RC-1003",
      recoverabilityBand: "HIGH",
      recoverabilityScore: 79,
      recoveredAmountPaise: incorrectOtp.amountPaise,
      status: "RECOVERED",
    },
    {
      actions: [
        action({
          actionType: "SEND_REMINDER",
          attemptNumber: 1,
          confidence: 41,
          createdAt: atMinutes(-49),
          executedAt: null,
          id: "action_rc1004_reminder",
          input: { channel: "simulated_message" },
          output: null,
          policyDecision: "DENIED",
          policyReason:
            "Merchant integration failures must not contact the customer.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason:
            "Customer reminder proposed despite a business-originated error.",
          result: "SKIPPED",
          scheduledFor: null,
        }),
        action({
          actionType: "STOP",
          attemptNumber: 1,
          confidence: 93,
          createdAt: atMinutes(-49),
          executedAt: atMinutes(-49),
          id: "action_rc1004_stop",
          input: null,
          output: { customerContactBlocked: true },
          policyDecision: "APPROVED",
          policyReason:
            "The customer cannot fix a merchant integration defect.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason:
            "Stop customer recovery and keep the case visible to the merchant.",
          result: "SUCCEEDED",
          scheduledFor: atMinutes(-49),
        }),
      ],
      amountAtRiskPaise: merchantError.amountPaise,
      auditEvents: [
        audit({
          actionId: "action_rc1004_reminder",
          actor: "POLICY_ENGINE",
          decision: "DENIED",
          eventType: "policy.decision",
          id: "audit_rc1004_denied",
          input: { actionType: "SEND_REMINDER" },
          occurredAt: atMinutes(-49),
          output: { moneyActionExecuted: false },
          reasoning:
            "error_source=business is not recoverable by customer contact.",
        }),
      ],
      closedAt: atMinutes(-49),
      customerId: merchantError.customerId,
      dataSource: "SIMULATED",
      diagnosis:
        "Merchant integration error. Customer recovery was stopped by policy.",
      failureCategory: "MERCHANT_ERROR",
      id: "case_rc1004",
      lastUpdatedAt: atMinutes(-49),
      openedAt: atMinutes(-50),
      payment: merchantError,
      publicId: "RC-1004",
      recoverabilityBand: "NONE",
      recoverabilityScore: 8,
      recoveredAmountPaise: 0,
      status: "STOPPED",
    },
    {
      actions: [
        action({
          actionType: "WAIT",
          attemptNumber: 1,
          confidence: 55,
          createdAt: atMinutes(-39),
          executedAt: atMinutes(-38),
          id: "action_rc1005_wait",
          input: { delayMinutes: 3 },
          output: null,
          policyDecision: "APPROVED",
          policyReason:
            "First authentication failure remains inside the attempt limit.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason: "Allow another customer attempt.",
          result: "SUCCEEDED",
          scheduledFor: atMinutes(-36),
        }),
        action({
          actionType: "ALTERNATIVE_METHOD",
          attemptNumber: 1,
          confidence: 49,
          createdAt: atMinutes(-36),
          executedAt: atMinutes(-35),
          id: "action_rc1005_alt",
          input: { suggestedMethod: "UPI" },
          output: { simulated: true },
          policyDecision: "APPROVED",
          policyReason: "Second attempt may use an alternative method.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason: "Repeated card authentication failure.",
          result: "FAILED",
          scheduledFor: atMinutes(-35),
        }),
        action({
          actionType: "STOP",
          attemptNumber: 1,
          confidence: 96,
          createdAt: atMinutes(-20),
          executedAt: atMinutes(-20),
          id: "action_rc1005_stop",
          input: { attempts: 3 },
          output: null,
          policyDecision: "APPROVED",
          policyReason: "Maximum attempts per case reached.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason:
            "Stop after the attempt limit rather than continuing recovery.",
          result: "SUCCEEDED",
          scheduledFor: atMinutes(-20),
        }),
      ],
      amountAtRiskPaise: repeatedFailure.amountPaise,
      auditEvents: [
        audit({
          actionId: "action_rc1005_stop",
          actor: "POLICY_ENGINE",
          decision: "APPROVED",
          eventType: "policy.decision",
          id: "audit_rc1005_exhausted",
          input: { maxAttemptsPerCase: 3 },
          occurredAt: atMinutes(-20),
          output: { status: "EXHAUSTED" },
          reasoning:
            "The agent is forbidden from endlessly recovering this customer.",
        }),
      ],
      closedAt: atMinutes(-20),
      customerId: repeatedFailure.customerId,
      dataSource: "SIMULATED",
      diagnosis:
        "Repeated customer authentication failures exhausted the attempt limit.",
      failureCategory: "CUSTOMER_AUTH",
      id: "case_rc1005",
      lastUpdatedAt: atMinutes(-20),
      openedAt: atMinutes(-40),
      payment: repeatedFailure,
      publicId: "RC-1005",
      recoverabilityBand: "LOW",
      recoverabilityScore: 22,
      recoveredAmountPaise: 0,
      status: "EXHAUSTED",
    },
    {
      actions: [
        action({
          actionType: "ESCALATE",
          attemptNumber: 1,
          confidence: 84,
          createdAt: atMinutes(-34),
          executedAt: atMinutes(-34),
          id: "action_rc1006_escalate",
          input: { reasonCode: "issuer_declined" },
          output: { queue: "merchant_ops" },
          policyDecision: "APPROVED",
          policyReason:
            "Issuer declines are outside automated customer recovery.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason: "Escalate the issuer failure for merchant review.",
          result: "SUCCEEDED",
          scheduledFor: atMinutes(-34),
        }),
      ],
      amountAtRiskPaise: issuerFailure.amountPaise,
      auditEvents: [
        audit({
          actionId: "action_rc1006_escalate",
          actor: "EXECUTION_LAYER",
          decision: "ESCALATED",
          eventType: "case.escalated",
          id: "audit_rc1006_escalated",
          input: { failureCategory: "ISSUER_FAILURE" },
          occurredAt: atMinutes(-34),
          output: null,
          reasoning: "Automated recovery cannot override an issuer decline.",
        }),
      ],
      closedAt: atMinutes(-34),
      customerId: issuerFailure.customerId,
      dataSource: "SIMULATED",
      diagnosis: "Issuer declined the authorization. The case was escalated.",
      failureCategory: "ISSUER_FAILURE",
      id: "case_rc1006",
      lastUpdatedAt: atMinutes(-34),
      openedAt: atMinutes(-35),
      payment: issuerFailure,
      publicId: "RC-1006",
      recoverabilityBand: "LOW",
      recoverabilityScore: 18,
      recoveredAmountPaise: 0,
      status: "ESCALATED",
    },
    {
      actions: [
        action({
          actionType: "CREATE_PAYMENT_LINK",
          attemptNumber: 1,
          confidence: 77,
          createdAt: atMinutes(-24),
          executedAt: atMinutes(-24),
          id: "action_rc1007_link_1",
          input: { expiresInMinutes: 30 },
          output: { error: "Razorpay API 5xx" },
          policyDecision: "APPROVED",
          policyReason:
            "Payment remains failed and a recovery link is allowed.",
          proposedBy: "RECOVERY_AGENT",
          razorpayReference: null,
          reason:
            "Create a recovery payment link after a transient Razorpay failure.",
          result: "FAILED",
          scheduledFor: atMinutes(-24),
        }),
        action({
          actionType: "CREATE_PAYMENT_LINK",
          attemptNumber: 2,
          confidence: 77,
          createdAt: atMinutes(-23),
          executedAt: atMinutes(-18),
          id: "action_rc1007_link_2",
          input: { expiresInMinutes: 30, retryOf: "action_rc1007_link_1" },
          output: { paymentLinkId: "plink_sim_rc1007" },
          policyDecision: "APPROVED",
          policyReason:
            "Retry uses the same idempotency family with a new attempt number.",
          proposedBy: "SYSTEM",
          razorpayReference: "plink_sim_rc1007",
          reason:
            "Retry the payment-link creation after the Razorpay 5xx without duplicating the first attempt.",
          result: "SUCCEEDED",
          scheduledFor: atMinutes(-18),
        }),
      ],
      amountAtRiskPaise: retryFailure.amountPaise,
      auditEvents: [
        audit({
          actionId: "action_rc1007_link_1",
          actor: "EXECUTION_LAYER",
          decision: "FAILED",
          eventType: "action.failed",
          id: "audit_rc1007_api_failure",
          input: { actionType: "CREATE_PAYMENT_LINK" },
          occurredAt: atMinutes(-24),
          output: { httpStatus: 503 },
          reasoning:
            "Razorpay API was temporarily unavailable. No duplicate link was created.",
        }),
        audit({
          actionId: "action_rc1007_link_2",
          actor: "EXECUTION_LAYER",
          decision: "SUCCEEDED",
          eventType: "action.retried",
          id: "audit_rc1007_retry",
          input: { attemptNumber: 2 },
          occurredAt: atMinutes(-18),
          output: { duplicateActions: 0 },
          reasoning:
            "The delayed retry succeeded with a distinct attempt number.",
        }),
      ],
      closedAt: null,
      customerId: retryFailure.customerId,
      dataSource: "SIMULATED",
      diagnosis:
        "Razorpay API failed once, retried without duplicates, and created a recovery link.",
      failureCategory: "GATEWAY_TRANSIENT",
      id: "case_rc1007",
      lastUpdatedAt: atMinutes(-18),
      openedAt: atMinutes(-25),
      payment: retryFailure,
      publicId: "RC-1007",
      recoverabilityBand: "HIGH",
      recoverabilityScore: 72,
      recoveredAmountPaise: 0,
      status: "RECOVERY_RUNNING",
    },
  ];
}

export function buildSeedDataset(seed = DEFAULT_DEMO_SEED): SeedDataset {
  const rng = createRng(seed);
  const createdAt = atMinutes(-120);

  return {
    customers,
    merchant: {
      createdAt,
      dataSource: "SIMULATED",
      id: MERCHANT_ID,
      name: DEMO_MERCHANT_NAME,
      slug: DEMO_MERCHANT_SLUG,
      updatedAt: createdAt,
    },
    policy: {
      allowedActions: [...actionTypes],
      id: "policy_aurora_retail",
      maxAttemptsPerCase: 3,
      maxMessagesPerDay: 2,
      minimumRetryDelayMinutes: 3,
      recoveryWindowHours: 48,
    },
    scenarios: buildScenarios(rng),
    seed,
    simulationRun: {
      attempts: 181,
      baselineRevenuePaise: 214_000 * PAISA_PER_RUPEE,
      completedAt: atMinutes(-5),
      configuration: {
        baselines: ["no_intervention", "naive_retry"],
        hiddenModel: "not_exposed_to_agent",
      },
      createdAt: atMinutes(-15),
      customerContacts: 24,
      falseInterventions: 0,
      id: "simulation_aurora_demo",
      incrementalRevenuePaise: 87_400 * PAISA_PER_RUPEE,
      paymentCount: 250,
      policyStops: 11,
      recoveredRevenuePaise: 301_400 * PAISA_PER_RUPEE,
      recoveryRateBps: 6250,
      revenueAtRiskPaise: 482_000 * PAISA_PER_RUPEE,
      seed,
      startedAt: atMinutes(-15),
    },
  };
}

export function idempotencyKeyFor(action: {
  actionType: string;
  attemptNumber: number;
  razorpayPaymentId: string;
}): string {
  return idempotencyKey(
    action.razorpayPaymentId,
    action.actionType,
    action.attemptNumber,
  );
}
