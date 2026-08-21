import type {
  ActionType,
  FailureCategory,
  PaymentMethod,
} from "@recoveryos/domain";

export const simulationStrategies = [
  "NO_INTERVENTION",
  "NAIVE_RETRY",
  "RECOVERY_OS",
] as const;
export type SimulationStrategy = (typeof simulationStrategies)[number];

export type SimulationAction = ActionType | "IMMEDIATE_RETRY" | "NONE";
export type CustomerType = "FIRST_TIME" | "REPEAT" | "HIGH_VALUE";

export interface SimulationConfiguration {
  paymentCount: number;
  seed: number;
  version: "step10-v1";
}

export interface SyntheticPaymentInput {
  amountPaise: number;
  customerType: CustomerType;
  failureCategory: FailureCategory;
  failureReason: string;
  failureSource: string;
  historicalSuccessBps: number;
  hourOfDay: number;
  id: string;
  optedOut: boolean;
  paymentMethod: PaymentMethod;
  previousAttempts: number;
}

export interface StrategyDecision {
  action: SimulationAction;
  customerContacted: boolean;
  policyStopped: boolean;
}

export interface SimulationOutcome {
  action: SimulationAction;
  attempts: number;
  customerContacted: boolean;
  falseIntervention: boolean;
  paymentId: string;
  policyStopped: boolean;
  recovered: boolean;
  recoveredAmountPaise: number;
  strategy: SimulationStrategy;
}

export interface StrategyMetrics {
  attempts: number;
  averageAttemptsBps: number;
  customerContacts: number;
  falseInterventions: number;
  policyStops: number;
  recoveredCount: number;
  recoveredRevenuePaise: number;
  recoveryRateBps: number;
  strategy: SimulationStrategy;
}

export interface SimulationEvaluation {
  configuration: SimulationConfiguration;
  configurationHash: string;
  dataSource: "SIMULATED";
  incrementalRevenuePaise: number;
  outcomes: SimulationOutcome[];
  payments: SyntheticPaymentInput[];
  revenueAtRiskPaise: number;
  strategies: Record<SimulationStrategy, StrategyMetrics>;
}
