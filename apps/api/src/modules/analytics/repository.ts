import type { PrismaClient } from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";

import type { AnalyticsOverviewRecords, AnalyticsRepository } from "./types.js";

export function createAnalyticsRepository(
  prisma: PrismaClient,
): AnalyticsRepository {
  return {
    async getOverviewRecords(): Promise<AnalyticsOverviewRecords> {
      const [cases, latestRun] = await Promise.all([
        prisma.recoveryCase.findMany({
          orderBy: { publicId: "asc" },
          select: {
            actions: {
              select: {
                actionType: true,
                dataSource: true,
                policyDecision: true,
                result: true,
              },
            },
            amountAtRiskPaise: true,
            dataSource: true,
            failureCategory: true,
            paymentEvent: { select: { paymentMethod: true } },
            recoverabilityBand: true,
            recoveredAmountPaise: true,
            status: true,
          },
          where: { merchant: { slug: DEMO_MERCHANT_SLUG } },
        }),
        prisma.simulationRun.findFirst({
          orderBy: { completedAt: "desc" },
          select: {
            attempts: true,
            baselineRevenuePaise: true,
            completedAt: true,
            configurationHash: true,
            customerContacts: true,
            dataSource: true,
            falseInterventions: true,
            incrementalRevenuePaise: true,
            id: true,
            noInterventionRevenuePaise: true,
            paymentCount: true,
            policyStops: true,
            recoveredRevenuePaise: true,
            recoveryRateBps: true,
            revenueAtRiskPaise: true,
            seed: true,
            startedAt: true,
          },
          where: { merchant: { slug: DEMO_MERCHANT_SLUG } },
        }),
      ]);

      if (!latestRun) return { cases, latestSimulationRun: null };

      const { id: runId, ...latestSimulationRun } = latestRun;
      const outcomes = await prisma.simulationOutcome.findMany({
        select: {
          action: true,
          paymentId: true,
          policyStopped: true,
          recovered: true,
          strategy: true,
        },
        where: { runId },
      });
      const noInterventionRecovered = new Map(
        outcomes
          .filter((outcome) => outcome.strategy === "NO_INTERVENTION")
          .map((outcome) => [outcome.paymentId, outcome.recovered]),
      );
      const recoveryOutcomes = outcomes.filter(
        (outcome) => outcome.strategy === "RECOVERY_OS",
      );
      return {
        cases,
        latestSimulationRun: {
          ...latestSimulationRun,
          escalations: recoveryOutcomes.filter(
            (outcome) => outcome.action === "ESCALATE",
          ).length,
          preventedFalseInterventions: recoveryOutcomes.filter(
            (outcome) =>
              outcome.policyStopped &&
              noInterventionRecovered.get(outcome.paymentId),
          ).length,
        },
      };
    },
  };
}
