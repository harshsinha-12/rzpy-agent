import { DEFAULT_CURRENCY, DEMO_MERCHANT_SLUG } from "@recoveryos/domain";

import { Prisma } from "../generated/prisma/client.js";
import type { PrismaClient } from "../prisma.js";
import { buildSeedDataset, idempotencyKeyFor } from "./scenarios.js";

export interface SeedSummary {
  actionCount: number;
  auditCount: number;
  caseCount: number;
  merchantId: string;
  publicIds: string[];
  seed: number;
}

function jsonField(
  value: Record<string, unknown> | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

export async function runDemoSeed(
  prisma: PrismaClient,
  seed?: number,
): Promise<SeedSummary> {
  const dataset = buildSeedDataset(seed);
  const nowPolicy = dataset.merchant.createdAt;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.merchant.findUnique({
      select: { id: true },
      where: { slug: DEMO_MERCHANT_SLUG },
    });

    if (existing) {
      await tx.auditEvent.deleteMany({
        where: { recoveryCase: { merchantId: existing.id } },
      });
      await tx.recoveryAction.deleteMany({
        where: { recoveryCase: { merchantId: existing.id } },
      });
      await tx.recoveryCase.deleteMany({
        where: { merchantId: existing.id },
      });
      await tx.simulationRun.deleteMany({
        where: { merchantId: existing.id },
      });
      await tx.paymentEvent.deleteMany({
        where: { merchantId: existing.id },
      });
      await tx.customer.deleteMany({ where: { merchantId: existing.id } });
      await tx.recoveryPolicy.deleteMany({
        where: { merchantId: existing.id },
      });
      await tx.merchant.delete({ where: { id: existing.id } });
    }

    await tx.merchant.create({
      data: dataset.merchant,
    });

    await tx.recoveryPolicy.create({
      data: {
        allowedActions: dataset.policy.allowedActions,
        createdAt: nowPolicy,
        dataSource: "SIMULATED",
        id: dataset.policy.id,
        maxAttemptsPerCase: dataset.policy.maxAttemptsPerCase,
        maxMessagesPerDay: dataset.policy.maxMessagesPerDay,
        merchantId: dataset.merchant.id,
        minimumRetryDelayMinutes: dataset.policy.minimumRetryDelayMinutes,
        recoveryWindowHours: dataset.policy.recoveryWindowHours,
        updatedAt: nowPolicy,
      },
    });

    await tx.customer.createMany({
      data: dataset.customers.map((customer) => ({
        createdAt: nowPolicy,
        dataSource: "SIMULATED",
        email: customer.email,
        externalRef: customer.externalRef,
        id: customer.id,
        merchantId: dataset.merchant.id,
        name: customer.name,
        optedOut: customer.optedOut,
        phone: customer.phone,
        updatedAt: nowPolicy,
      })),
    });

    for (const scenario of dataset.scenarios) {
      await tx.paymentEvent.create({
        data: {
          amountPaise: scenario.payment.amountPaise,
          createdAt: scenario.payment.occurredAt,
          currency: DEFAULT_CURRENCY,
          customerId: scenario.payment.customerId,
          dataSource: scenario.dataSource,
          errorCode: scenario.payment.errorCode,
          errorDescription: scenario.payment.errorDescription,
          errorReason: scenario.payment.errorReason,
          errorSource: scenario.payment.errorSource,
          errorStep: scenario.payment.errorStep,
          eventType: scenario.payment.eventType,
          id: scenario.payment.id,
          merchantId: dataset.merchant.id,
          occurredAt: scenario.payment.occurredAt,
          paymentMethod: scenario.payment.paymentMethod,
          rawPayload: jsonField(scenario.payment.rawPayload),
          razorpayOrderId: scenario.payment.razorpayOrderId,
          razorpayPaymentId: scenario.payment.razorpayPaymentId,
          status: scenario.payment.status,
        },
      });

      await tx.recoveryCase.create({
        data: {
          amountAtRiskPaise: scenario.amountAtRiskPaise,
          closedAt: scenario.closedAt,
          currency: DEFAULT_CURRENCY,
          customerId: scenario.customerId,
          dataSource: scenario.dataSource,
          diagnosis: scenario.diagnosis,
          failureCategory: scenario.failureCategory,
          id: scenario.id,
          lastUpdatedAt: scenario.lastUpdatedAt,
          merchantId: dataset.merchant.id,
          openedAt: scenario.openedAt,
          paymentEventId: scenario.payment.id,
          publicId: scenario.publicId,
          recoverabilityBand: scenario.recoverabilityBand,
          recoverabilityScore: scenario.recoverabilityScore,
          recoveredAmountPaise: scenario.recoveredAmountPaise,
          status: scenario.status,
        },
      });

      for (const recoveryAction of scenario.actions) {
        await tx.recoveryAction.create({
          data: {
            actionType: recoveryAction.actionType,
            attemptNumber: recoveryAction.attemptNumber,
            caseId: scenario.id,
            confidence: recoveryAction.confidence,
            createdAt: recoveryAction.createdAt,
            dataSource: scenario.dataSource,
            executedAt: recoveryAction.executedAt,
            id: recoveryAction.id,
            idempotencyKey: idempotencyKeyFor({
              actionType: recoveryAction.actionType,
              attemptNumber: recoveryAction.attemptNumber,
              razorpayPaymentId: scenario.payment.razorpayPaymentId,
            }),
            input: jsonField(recoveryAction.input),
            output: jsonField(recoveryAction.output),
            policyDecision: recoveryAction.policyDecision,
            policyReason: recoveryAction.policyReason,
            proposedBy: recoveryAction.proposedBy,
            razorpayReference: recoveryAction.razorpayReference,
            reason: recoveryAction.reason,
            result: recoveryAction.result,
            scheduledFor: recoveryAction.scheduledFor,
          },
        });
      }

      await tx.auditEvent.createMany({
        data: scenario.auditEvents.map((event) => ({
          actionId: event.actionId,
          actor: event.actor,
          caseId: scenario.id,
          dataSource: scenario.dataSource,
          decision: event.decision,
          eventType: event.eventType,
          id: event.id,
          input: jsonField(event.input),
          occurredAt: event.occurredAt,
          output: jsonField(event.output),
          reasoning: event.reasoning,
        })),
      });
    }

    await tx.simulationRun.create({
      data: {
        attempts: dataset.simulationRun.attempts,
        baselineRevenuePaise: dataset.simulationRun.baselineRevenuePaise,
        completedAt: dataset.simulationRun.completedAt,
        configurationHash: dataset.simulationRun.configurationHash,
        configuration: jsonField(dataset.simulationRun.configuration),
        createdAt: dataset.simulationRun.createdAt,
        customerContacts: dataset.simulationRun.customerContacts,
        dataSource: "SIMULATED",
        falseInterventions: dataset.simulationRun.falseInterventions,
        id: dataset.simulationRun.id,
        incrementalRevenuePaise: dataset.simulationRun.incrementalRevenuePaise,
        merchantId: dataset.merchant.id,
        noInterventionRevenuePaise:
          dataset.simulationRun.noInterventionRevenuePaise,
        paymentCount: dataset.simulationRun.paymentCount,
        policyStops: dataset.simulationRun.policyStops,
        recoveredRevenuePaise: dataset.simulationRun.recoveredRevenuePaise,
        recoveryRateBps: dataset.simulationRun.recoveryRateBps,
        revenueAtRiskPaise: dataset.simulationRun.revenueAtRiskPaise,
        seed: dataset.simulationRun.seed,
        startedAt: dataset.simulationRun.startedAt,
      },
    });
  });

  return {
    actionCount: dataset.scenarios.reduce(
      (count, scenario) => count + scenario.actions.length,
      0,
    ),
    auditCount: dataset.scenarios.reduce(
      (count, scenario) => count + scenario.auditEvents.length,
      0,
    ),
    caseCount: dataset.scenarios.length,
    merchantId: dataset.merchant.id,
    publicIds: dataset.scenarios.map((scenario) => scenario.publicId),
    seed: dataset.seed,
  };
}
