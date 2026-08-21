import { describe, expect, it } from "vitest";

import { runSimulation } from "./evaluate.js";
import { simulationStrategies } from "./types.js";

describe("runSimulation", () => {
  it("reproduces the same batch and outcomes for the same configuration", () => {
    const first = runSimulation({ paymentCount: 250, seed: 42 });
    const second = runSimulation({ paymentCount: 250, seed: 42 });
    const different = runSimulation({ paymentCount: 250, seed: 43 });

    expect(second).toEqual(first);
    expect(different).not.toEqual(first);
  });

  it("reconciles every aggregate metric with individual outcomes", () => {
    const evaluation = runSimulation({ paymentCount: 300, seed: 20260821 });
    expect(evaluation.outcomes).toHaveLength(300 * simulationStrategies.length);

    for (const strategy of simulationStrategies) {
      const outcomes = evaluation.outcomes.filter(
        (outcome) => outcome.strategy === strategy,
      );
      const metrics = evaluation.strategies[strategy];
      expect(metrics.recoveredCount).toBe(
        outcomes.filter((outcome) => outcome.recovered).length,
      );
      expect(metrics.recoveredRevenuePaise).toBe(
        outcomes.reduce(
          (sum, outcome) => sum + outcome.recoveredAmountPaise,
          0,
        ),
      );
      expect(metrics.attempts).toBe(
        outcomes.reduce((sum, outcome) => sum + outcome.attempts, 0),
      );
      expect(metrics.customerContacts).toBe(
        outcomes.filter((outcome) => outcome.customerContacted).length,
      );
      expect(metrics.policyStops).toBe(
        outcomes.filter((outcome) => outcome.policyStopped).length,
      );
      expect(metrics.falseInterventions).toBe(
        outcomes.filter((outcome) => outcome.falseIntervention).length,
      );
    }
    expect(evaluation.incrementalRevenuePaise).toBe(
      evaluation.strategies.RECOVERY_OS.recoveredRevenuePaise -
        evaluation.strategies.NAIVE_RETRY.recoveredRevenuePaise,
    );
  });

  it("keeps hidden probabilities outside visible inputs and public outcomes", () => {
    const evaluation = runSimulation({ paymentCount: 250, seed: 7 });
    const publicEvaluation = JSON.stringify(evaluation);

    expect(publicEvaluation).not.toContain("hiddenProfile");
    expect(publicEvaluation).not.toContain("Probability");
    expect(publicEvaluation).not.toContain("probability");
    expect(evaluation.dataSource).toBe("SIMULATED");
    expect(
      evaluation.payments.every((payment) => payment.amountPaise > 0),
    ).toBe(true);
  });

  it("requires the planned 250 to 500 payment batch size", () => {
    expect(() => runSimulation({ paymentCount: 249 })).toThrow(
      "between 250 and 500",
    );
    expect(() => runSimulation({ paymentCount: 501 })).toThrow(
      "between 250 and 500",
    );
  });
});
