import { loadEnvFile } from "node:process";

import { DEFAULT_CURRENCY } from "@recoveryos/domain";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { Prisma } from "./generated/prisma/client.js";
import { createPrismaClient } from "./prisma.js";

try {
  loadEnvFile(new URL("../../../.env", import.meta.url));
} catch (error) {
  if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
    throw error;
  }
}

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://recoveryos:recoveryos@localhost:5432/recoveryos";

const MERCHANT_ID = "merchant_constraint_harness";
const CUSTOMER_ID = "customer_constraint_harness";
const PAYMENT_ID = "payment_constraint_harness";
const CASE_ID = "case_constraint_harness";
const CLOCK = new Date("2026-08-20T11:00:00.000Z");

describe("database constraints", () => {
  const prisma = createPrismaClient(databaseUrl);

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.merchant.deleteMany({ where: { id: MERCHANT_ID } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function insertHarness() {
    await prisma.merchant.create({
      data: {
        createdAt: CLOCK,
        dataSource: "RAZORPAY_TEST_MODE",
        id: MERCHANT_ID,
        name: "Constraint Harness",
        slug: "constraint-harness",
        updatedAt: CLOCK,
      },
    });
    await prisma.customer.create({
      data: {
        createdAt: CLOCK,
        dataSource: "RAZORPAY_TEST_MODE",
        externalRef: "cust_constraint",
        id: CUSTOMER_ID,
        merchantId: MERCHANT_ID,
        name: "Constraint Customer",
        updatedAt: CLOCK,
      },
    });
    await prisma.paymentEvent.create({
      data: {
        amountPaise: 499900,
        createdAt: CLOCK,
        currency: DEFAULT_CURRENCY,
        customerId: CUSTOMER_ID,
        dataSource: "RAZORPAY_TEST_MODE",
        eventType: "payment.failed",
        id: PAYMENT_ID,
        merchantId: MERCHANT_ID,
        occurredAt: CLOCK,
        paymentMethod: "UPI",
        rawPayload: { event: "payment.failed" },
        razorpayOrderId: "order_constraint",
        razorpayPaymentId: "pay_constraint",
        status: "FAILED",
      },
    });
    await prisma.recoveryCase.create({
      data: {
        amountAtRiskPaise: 499900,
        currency: DEFAULT_CURRENCY,
        customerId: CUSTOMER_ID,
        dataSource: "RAZORPAY_TEST_MODE",
        diagnosis: "Constraint harness case",
        failureCategory: "UNKNOWN",
        id: CASE_ID,
        lastUpdatedAt: CLOCK,
        merchantId: MERCHANT_ID,
        openedAt: CLOCK,
        paymentEventId: PAYMENT_ID,
        publicId: "RC-CONSTRAINT",
        recoverabilityBand: "LOW",
        recoverabilityScore: 10,
        status: "OPEN",
      },
    });
  }

  it("rejects duplicate merchant slugs and payment IDs", async () => {
    await insertHarness();

    await expect(
      prisma.merchant.create({
        data: {
          createdAt: CLOCK,
          dataSource: "SIMULATED",
          id: "merchant_constraint_duplicate",
          name: "Duplicate",
          slug: "constraint-harness",
          updatedAt: CLOCK,
        },
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002",
    );

    await expect(
      prisma.paymentEvent.create({
        data: {
          amountPaise: 100,
          createdAt: CLOCK,
          currency: DEFAULT_CURRENCY,
          customerId: CUSTOMER_ID,
          dataSource: "SIMULATED",
          eventType: "payment.failed",
          id: "payment_constraint_duplicate",
          merchantId: MERCHANT_ID,
          occurredAt: CLOCK,
          paymentMethod: "UPI",
          rawPayload: { event: "payment.failed" },
          razorpayOrderId: "order_constraint_2",
          razorpayPaymentId: "pay_constraint",
          status: "FAILED",
        },
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002",
    );
  });

  it("rejects a second case for the same payment and a missing merchant FK", async () => {
    await insertHarness();

    await expect(
      prisma.recoveryCase.create({
        data: {
          amountAtRiskPaise: 100,
          currency: DEFAULT_CURRENCY,
          customerId: CUSTOMER_ID,
          dataSource: "SIMULATED",
          diagnosis: "Duplicate payment case",
          failureCategory: "UNKNOWN",
          id: "case_constraint_duplicate",
          lastUpdatedAt: CLOCK,
          merchantId: MERCHANT_ID,
          openedAt: CLOCK,
          paymentEventId: PAYMENT_ID,
          publicId: "RC-CONSTRAINT-2",
          recoverabilityBand: "LOW",
          recoverabilityScore: 10,
          status: "OPEN",
        },
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002",
    );

    await expect(
      prisma.customer.create({
        data: {
          createdAt: CLOCK,
          dataSource: "SIMULATED",
          externalRef: "missing_merchant",
          id: "customer_missing_merchant",
          merchantId: "merchant_does_not_exist",
          name: "Missing Merchant",
          updatedAt: CLOCK,
        },
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003",
    );
  });

  it("rejects duplicate action idempotency keys", async () => {
    await insertHarness();

    await prisma.recoveryAction.create({
      data: {
        actionType: "WAIT",
        attemptNumber: 1,
        caseId: CASE_ID,
        confidence: 50,
        createdAt: CLOCK,
        dataSource: "RAZORPAY_TEST_MODE",
        id: "action_constraint_1",
        idempotencyKey: "recovery:pay_constraint:WAIT:1",
        policyDecision: "APPROVED",
        policyReason: "Harness",
        proposedBy: "SYSTEM",
        reason: "Constraint test",
        result: "PENDING",
      },
    });

    await expect(
      prisma.recoveryAction.create({
        data: {
          actionType: "WAIT",
          attemptNumber: 2,
          caseId: CASE_ID,
          confidence: 50,
          createdAt: CLOCK,
          dataSource: "RAZORPAY_TEST_MODE",
          id: "action_constraint_2",
          idempotencyKey: "recovery:pay_constraint:WAIT:1",
          policyDecision: "APPROVED",
          policyReason: "Harness",
          proposedBy: "SYSTEM",
          reason: "Constraint test",
          result: "PENDING",
        },
      }),
    ).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002",
    );
  });
});
