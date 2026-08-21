import type { SimulationConfiguration } from "./types.js";

export const DEFAULT_SIMULATION_CONFIGURATION: SimulationConfiguration = {
  paymentCount: 500,
  seed: 20260821,
  version: "step10-v1",
};

export function normalizeSimulationConfiguration(
  input: Partial<SimulationConfiguration> = {},
): SimulationConfiguration {
  const configuration = { ...DEFAULT_SIMULATION_CONFIGURATION, ...input };
  if (
    !Number.isInteger(configuration.paymentCount) ||
    configuration.paymentCount < 250 ||
    configuration.paymentCount > 500
  ) {
    throw new Error("Simulation paymentCount must be between 250 and 500.");
  }
  if (!Number.isSafeInteger(configuration.seed)) {
    throw new Error("Simulation seed must be a safe integer.");
  }
  return configuration;
}
