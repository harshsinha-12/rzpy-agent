import type {
  ActionResult,
  ActionType,
  DataSource,
  FailureCategory,
  PaymentMethod,
  PolicyDecision,
  RecoverabilityBand,
  RecoveryCaseStatus,
} from "@recoveryos/domain";

export interface AnalyticsCaseRecord {
  amountAtRiskPaise: number;
  recoveredAmountPaise: number;
  status: RecoveryCaseStatus;
  failureCategory: FailureCategory;
  recoverabilityBand: RecoverabilityBand;
  dataSource: DataSource;
  paymentEvent: {
    paymentMethod: PaymentMethod;
  };
  actions: Array<{
    actionType: ActionType;
    policyDecision: PolicyDecision;
    result: ActionResult;
    dataSource: DataSource;
  }>;
}

export interface SimulationRunRecord {
  configurationHash: string;
  escalations: number;
  seed: number;
  paymentCount: number;
  revenueAtRiskPaise: number;
  noInterventionRevenuePaise: number;
  recoveredRevenuePaise: number;
  baselineRevenuePaise: number;
  incrementalRevenuePaise: number;
  recoveryRateBps: number;
  attempts: number;
  falseInterventions: number;
  policyStops: number;
  preventedFalseInterventions: number;
  customerContacts: number;
  dataSource: DataSource;
  startedAt: Date;
  completedAt: Date;
}

export interface AnalyticsOverviewRecords {
  cases: AnalyticsCaseRecord[];
  latestSimulationRun: SimulationRunRecord | null;
}

export interface AnalyticsRepository {
  getOverviewRecords(): Promise<AnalyticsOverviewRecords>;
}

export interface AnalyticsService {
  getOverview(): Promise<unknown>;
}
