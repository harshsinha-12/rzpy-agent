import type { PrismaClient } from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";

import type { AnalyticsOverviewRecords, AnalyticsRepository } from "./types.js";

export function createAnalyticsRepository(
  prisma: PrismaClient,
): AnalyticsRepository {
  return {
    async getOverviewRecords(): Promise<AnalyticsOverviewRecords> {
      const [cases, latestSimulationRun] = await Promise.all([
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

      return { cases, latestSimulationRun };
    },
  };
}
