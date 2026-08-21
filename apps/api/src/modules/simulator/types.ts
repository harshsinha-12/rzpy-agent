import type {
  SimulationConfiguration,
  SimulationEvaluation,
  SimulationStrategy,
  StrategyMetrics,
} from "@recoveryos/simulator";

export interface PersistedSimulationRun {
  completedAt: Date;
  configuration: SimulationConfiguration;
  configurationHash: string;
  dataSource: "SIMULATED";
  id: string;
  incrementalRevenuePaise: number;
  outcomeCount: number;
  revenueAtRiskPaise: number;
  startedAt: Date;
  strategies: Record<SimulationStrategy, StrategyMetrics>;
}

export interface SimulatorRepository {
  persist(evaluation: SimulationEvaluation): Promise<PersistedSimulationRun>;
}

export interface SimulatorService {
  run(configuration: Partial<SimulationConfiguration>): Promise<{
    data: Omit<PersistedSimulationRun, "completedAt" | "startedAt"> & {
      completedAt: string;
      startedAt: string;
    };
  }>;
}
