import { actionTypes, dataSources } from "@recoveryos/domain";
import { z } from "zod";

const breakdownSchema = z.object({
  count: z.number().int().nonnegative(),
  dataSources: z.array(z.enum(dataSources)),
  recoveredRevenuePaise: z.number().int().nonnegative(),
  revenueAtRiskPaise: z.number().int().nonnegative(),
  value: z.string(),
});

const simulationRunSchema = z.object({
  attempts: z.number().int().nonnegative(),
  baselineRevenuePaise: z.number().int().nonnegative(),
  completedAt: z.string().datetime(),
  configurationHash: z.string().min(1),
  customerContacts: z.number().int().nonnegative(),
  dataSource: z.enum(dataSources),
  escalations: z.number().int().nonnegative(),
  falseInterventions: z.number().int().nonnegative(),
  incrementalRevenuePaise: z.number().int(),
  noInterventionRevenuePaise: z.number().int().nonnegative(),
  paymentCount: z.number().int().nonnegative(),
  policyStops: z.number().int().nonnegative(),
  preventedFalseInterventions: z.number().int().nonnegative(),
  recoveredRevenuePaise: z.number().int().nonnegative(),
  recoveryRateBps: z.number().int().nonnegative(),
  revenueAtRiskPaise: z.number().int().nonnegative(),
  seed: z.number().int(),
  startedAt: z.string().datetime(),
});

export const analyticsOverviewResponseSchema = z.object({
  data: z.object({
    dataSources: z.array(z.enum(dataSources)),
    failureBreakdown: z.array(breakdownSchema),
    funnel: z.object({
      approvedActionCases: z.number().int().nonnegative(),
      recoverableCases: z.number().int().nonnegative(),
      recoveredCases: z.number().int().nonnegative(),
      totalCases: z.number().int().nonnegative(),
    }),
    kpis: z.object({
      outstandingRevenueAtRiskPaise: z.number().int().nonnegative(),
      recoveredRevenuePaise: z.number().int().nonnegative(),
      recoveryRateBps: z.number().int().nonnegative(),
      totalRevenueAtRiskPaise: z.number().int().nonnegative(),
    }),
    latestSimulationRun: simulationRunSchema.nullable(),
    paymentMethodBreakdown: z.array(breakdownSchema),
    recoveryStatusBreakdown: z.array(breakdownSchema),
    strategyPerformance: z.array(
      z.object({
        actionType: z.enum(actionTypes),
        attemptedActions: z.number().int().nonnegative(),
        dataSources: z.array(z.enum(dataSources)),
        successRateBps: z.number().int().nonnegative(),
        successfulActions: z.number().int().nonnegative(),
      }),
    ),
  }),
});

export type AnalyticsOverview = z.infer<
  typeof analyticsOverviewResponseSchema
>["data"];
