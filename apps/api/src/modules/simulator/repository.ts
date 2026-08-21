import type { Prisma, PrismaClient } from "@recoveryos/database";
import { DEMO_MERCHANT_SLUG } from "@recoveryos/domain";
import type { SimulationEvaluation } from "@recoveryos/simulator";

import type { PersistedSimulationRun, SimulatorRepository } from "./types.js";

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function createSimulatorRepository(
  prisma: PrismaClient,
): SimulatorRepository {
  return {
    async persist(
      evaluation: SimulationEvaluation,
    ): Promise<PersistedSimulationRun> {
      const merchant = await prisma.merchant.findUnique({
        select: { id: true },
        where: { slug: DEMO_MERCHANT_SLUG },
      });
      if (!merchant) {
        throw new Error("The demo merchant must be seeded before simulation.");
      }

      const startedAt = new Date();
      const completedAt = new Date(startedAt.getTime() + 1);
      const recovery = evaluation.strategies.RECOVERY_OS;
      const baseline = evaluation.strategies.NAIVE_RETRY;
      const noIntervention = evaluation.strategies.NO_INTERVENTION;
      const runId = `simulation_${merchant.id}_${evaluation.configuration.seed}_${evaluation.configurationHash}`;
      const storedConfiguration = jsonValue({
        ...evaluation.configuration,
        hiddenModel: "not_exposed_to_strategy",
        strategies: evaluation.strategies,
      });

      await prisma.$transaction(async (tx) => {
        const run = await tx.simulationRun.upsert({
          create: {
            attempts: recovery.attempts,
            baselineRevenuePaise: baseline.recoveredRevenuePaise,
            completedAt,
            configuration: storedConfiguration,
            configurationHash: evaluation.configurationHash,
            createdAt: startedAt,
            customerContacts: recovery.customerContacts,
            dataSource: "SIMULATED",
            falseInterventions: recovery.falseInterventions,
            id: runId,
            incrementalRevenuePaise: evaluation.incrementalRevenuePaise,
            merchantId: merchant.id,
            noInterventionRevenuePaise: noIntervention.recoveredRevenuePaise,
            paymentCount: evaluation.configuration.paymentCount,
            policyStops: recovery.policyStops,
            recoveredRevenuePaise: recovery.recoveredRevenuePaise,
            recoveryRateBps: recovery.recoveryRateBps,
            revenueAtRiskPaise: evaluation.revenueAtRiskPaise,
            seed: evaluation.configuration.seed,
            startedAt,
          },
          update: {
            attempts: recovery.attempts,
            baselineRevenuePaise: baseline.recoveredRevenuePaise,
            completedAt,
            configuration: storedConfiguration,
            customerContacts: recovery.customerContacts,
            falseInterventions: recovery.falseInterventions,
            incrementalRevenuePaise: evaluation.incrementalRevenuePaise,
            noInterventionRevenuePaise: noIntervention.recoveredRevenuePaise,
            paymentCount: evaluation.configuration.paymentCount,
            policyStops: recovery.policyStops,
            recoveredRevenuePaise: recovery.recoveredRevenuePaise,
            recoveryRateBps: recovery.recoveryRateBps,
            revenueAtRiskPaise: evaluation.revenueAtRiskPaise,
            startedAt,
          },
          where: {
            merchantId_seed_configurationHash: {
              configurationHash: evaluation.configurationHash,
              merchantId: merchant.id,
              seed: evaluation.configuration.seed,
            },
          },
        });
        await tx.simulationOutcome.deleteMany({ where: { runId: run.id } });
        const paymentIndex = new Map(
          evaluation.payments.map((payment, index) => [payment.id, index]),
        );
        const visibleInputs = new Map(
          evaluation.payments.map((payment) => [payment.id, payment]),
        );
        await tx.simulationOutcome.createMany({
          data: evaluation.outcomes.map((outcome) => {
            const index = paymentIndex.get(outcome.paymentId);
            const visibleInput = visibleInputs.get(outcome.paymentId);
            if (index === undefined || !visibleInput) {
              throw new Error("Simulation outcome did not match its payment.");
            }
            return {
              action: outcome.action,
              attempts: outcome.attempts,
              createdAt: completedAt,
              customerContacted: outcome.customerContacted,
              dataSource: "SIMULATED" as const,
              falseIntervention: outcome.falseIntervention,
              id: `${run.id}:${outcome.strategy}:${index}`,
              paymentId: outcome.paymentId,
              paymentIndex: index,
              policyStopped: outcome.policyStopped,
              recovered: outcome.recovered,
              recoveredAmountPaise: outcome.recoveredAmountPaise,
              runId: run.id,
              strategy: outcome.strategy,
              visibleInput: jsonValue(visibleInput),
            };
          }),
        });
      });

      return {
        completedAt,
        configuration: evaluation.configuration,
        configurationHash: evaluation.configurationHash,
        dataSource: "SIMULATED",
        id: runId,
        incrementalRevenuePaise: evaluation.incrementalRevenuePaise,
        outcomeCount: evaluation.outcomes.length,
        revenueAtRiskPaise: evaluation.revenueAtRiskPaise,
        startedAt,
        strategies: evaluation.strategies,
      };
    },
  };
}
