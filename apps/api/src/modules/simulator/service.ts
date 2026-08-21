import { runSimulation } from "@recoveryos/simulator";

import type { SimulatorRepository, SimulatorService } from "./types.js";

export function createSimulatorService(
  repository: SimulatorRepository,
): SimulatorService {
  return {
    async run(configuration) {
      const persisted = await repository.persist(runSimulation(configuration));
      return {
        data: {
          ...persisted,
          completedAt: persisted.completedAt.toISOString(),
          startedAt: persisted.startedAt.toISOString(),
        },
      };
    },
  };
}
