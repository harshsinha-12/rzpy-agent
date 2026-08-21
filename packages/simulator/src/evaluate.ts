import { normalizeSimulationConfiguration } from "./config.js";
import { generateSyntheticBatch } from "./generator.js";
import { hiddenRecoveryThresholdBps } from "./outcome-model.js";
import { configurationHash, deterministicRoll } from "./random.js";
import {
  naiveRetryStrategy,
  noInterventionStrategy,
  recoveryOsStrategy,
} from "./strategies.js";
import {
  simulationStrategies,
  type SimulationConfiguration,
  type SimulationEvaluation,
  type SimulationOutcome,
  type SimulationStrategy,
  type StrategyDecision,
  type StrategyMetrics,
} from "./types.js";

function attemptsFor(decision: StrategyDecision): number {
  return ["NONE", "STOP", "ESCALATE"].includes(decision.action) ? 0 : 1;
}

function rateBps(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator * 10_000) / denominator);
}

function metricsFor(
  strategy: SimulationStrategy,
  outcomes: SimulationOutcome[],
): StrategyMetrics {
  const matching = outcomes.filter((outcome) => outcome.strategy === strategy);
  const attempts = matching.reduce((sum, outcome) => sum + outcome.attempts, 0);
  const recovered = matching.filter((outcome) => outcome.recovered);
  return {
    attempts,
    averageAttemptsBps: rateBps(attempts, matching.length),
    customerContacts: matching.filter((outcome) => outcome.customerContacted)
      .length,
    falseInterventions: matching.filter((outcome) => outcome.falseIntervention)
      .length,
    policyStops: matching.filter((outcome) => outcome.policyStopped).length,
    recoveredCount: recovered.length,
    recoveredRevenuePaise: recovered.reduce(
      (sum, outcome) => sum + outcome.recoveredAmountPaise,
      0,
    ),
    recoveryRateBps: rateBps(recovered.length, matching.length),
    strategy,
  };
}

export function runSimulation(
  input: Partial<SimulationConfiguration> = {},
): SimulationEvaluation {
  const configuration = normalizeSimulationConfiguration(input);
  const generated = generateSyntheticBatch(configuration);
  const outcomes: SimulationOutcome[] = [];

  for (const item of generated) {
    const commonRollBps = Math.floor(
      deterministicRoll(configuration.seed, `${item.input.id}:outcome`) *
        10_000,
    );
    const naturalRecovered =
      commonRollBps <
      hiddenRecoveryThresholdBps({
        action: "NONE",
        payment: item.input,
        profile: item.hiddenProfile,
      });
    const decisions: Record<SimulationStrategy, StrategyDecision> = {
      NAIVE_RETRY: naiveRetryStrategy(),
      NO_INTERVENTION: noInterventionStrategy(),
      RECOVERY_OS: recoveryOsStrategy(item.input),
    };

    for (const strategy of simulationStrategies) {
      const decision = decisions[strategy];
      const recovered =
        commonRollBps <
        hiddenRecoveryThresholdBps({
          action: decision.action,
          payment: item.input,
          profile: item.hiddenProfile,
        });
      const attempts = attemptsFor(decision);
      outcomes.push({
        action: decision.action,
        attempts,
        customerContacted: decision.customerContacted,
        falseIntervention: attempts > 0 && naturalRecovered,
        paymentId: item.input.id,
        policyStopped: decision.policyStopped,
        recovered,
        recoveredAmountPaise: recovered ? item.input.amountPaise : 0,
        strategy,
      });
    }
  }

  const strategies = Object.fromEntries(
    simulationStrategies.map((strategy) => [
      strategy,
      metricsFor(strategy, outcomes),
    ]),
  ) as Record<SimulationStrategy, StrategyMetrics>;
  const serializedConfiguration = JSON.stringify(configuration);
  return {
    configuration,
    configurationHash: configurationHash(serializedConfiguration),
    dataSource: "SIMULATED",
    incrementalRevenuePaise:
      strategies.RECOVERY_OS.recoveredRevenuePaise -
      strategies.NAIVE_RETRY.recoveredRevenuePaise,
    outcomes,
    payments: generated.map((item) => item.input),
    revenueAtRiskPaise: generated.reduce(
      (sum, item) => sum + item.input.amountPaise,
      0,
    ),
    strategies,
  };
}
