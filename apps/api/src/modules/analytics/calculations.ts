import {
  actionTypes,
  failureCategories,
  paymentMethods,
  recoveryCaseStatuses,
  type DataSource,
} from "@recoveryos/domain";

import type { AnalyticsCaseRecord, AnalyticsOverviewRecords } from "./types.js";

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function uniqueDataSources(records: Array<{ dataSource: DataSource }>) {
  return [...new Set(records.map((record) => record.dataSource))].sort();
}

function rateBps(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator * 10_000) / denominator);
}

function amountBreakdown<T extends string>(
  values: readonly T[],
  cases: AnalyticsCaseRecord[],
  select: (item: AnalyticsCaseRecord) => T,
) {
  return values.flatMap((value) => {
    const matchingCases = cases.filter((item) => select(item) === value);

    if (matchingCases.length === 0) {
      return [];
    }

    return [
      {
        count: matchingCases.length,
        dataSources: uniqueDataSources(matchingCases),
        recoveredRevenuePaise: sum(
          matchingCases.map((item) => item.recoveredAmountPaise),
        ),
        revenueAtRiskPaise: sum(
          matchingCases.map((item) => item.amountAtRiskPaise),
        ),
        value,
      },
    ];
  });
}

export function calculateAnalyticsOverview(records: AnalyticsOverviewRecords) {
  const totalRevenueAtRiskPaise = sum(
    records.cases.map((item) => item.amountAtRiskPaise),
  );
  const recoveredRevenuePaise = sum(
    records.cases.map((item) => item.recoveredAmountPaise),
  );
  const outstandingRevenueAtRiskPaise = sum(
    records.cases.map((item) =>
      Math.max(0, item.amountAtRiskPaise - item.recoveredAmountPaise),
    ),
  );
  const approvedActionCases = records.cases.filter((item) =>
    item.actions.some((action) => action.policyDecision === "APPROVED"),
  ).length;

  const allActions = records.cases.flatMap((item) => item.actions);
  const strategyPerformance = actionTypes.flatMap((actionType) => {
    const actions = allActions.filter(
      (action) => action.actionType === actionType,
    );

    if (actions.length === 0) {
      return [];
    }

    const successfulActions = actions.filter(
      (action) => action.result === "SUCCEEDED",
    ).length;

    return [
      {
        actionType,
        attemptedActions: actions.length,
        dataSources: uniqueDataSources(actions),
        successRateBps: rateBps(successfulActions, actions.length),
        successfulActions,
      },
    ];
  });

  return {
    dataSources: uniqueDataSources(records.cases),
    failureBreakdown: amountBreakdown(
      failureCategories,
      records.cases,
      (item) => item.failureCategory,
    ),
    funnel: {
      approvedActionCases,
      recoverableCases: records.cases.filter(
        (item) => item.recoverabilityBand !== "NONE",
      ).length,
      recoveredCases: records.cases.filter(
        (item) => item.status === "RECOVERED",
      ).length,
      totalCases: records.cases.length,
    },
    kpis: {
      outstandingRevenueAtRiskPaise,
      recoveredRevenuePaise,
      recoveryRateBps: rateBps(recoveredRevenuePaise, totalRevenueAtRiskPaise),
      totalRevenueAtRiskPaise,
    },
    latestSimulationRun: records.latestSimulationRun
      ? {
          ...records.latestSimulationRun,
          completedAt: records.latestSimulationRun.completedAt.toISOString(),
          startedAt: records.latestSimulationRun.startedAt.toISOString(),
        }
      : null,
    paymentMethodBreakdown: amountBreakdown(
      paymentMethods,
      records.cases,
      (item) => item.paymentEvent.paymentMethod,
    ),
    recoveryStatusBreakdown: amountBreakdown(
      recoveryCaseStatuses,
      records.cases,
      (item) => item.status,
    ),
    strategyPerformance,
  };
}
