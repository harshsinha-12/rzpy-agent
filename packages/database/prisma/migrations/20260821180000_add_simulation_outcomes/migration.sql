ALTER TABLE "SimulationRun"
ADD COLUMN "configurationHash" TEXT NOT NULL DEFAULT 'legacy',
ADD COLUMN "noInterventionRevenuePaise" INTEGER NOT NULL DEFAULT 0;

DROP INDEX "SimulationRun_merchantId_seed_key";

CREATE UNIQUE INDEX "SimulationRun_merchantId_seed_configurationHash_key"
ON "SimulationRun"("merchantId", "seed", "configurationHash");

CREATE TABLE "SimulationOutcome" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "paymentIndex" INTEGER NOT NULL,
    "paymentId" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "visibleInput" JSONB NOT NULL,
    "recovered" BOOLEAN NOT NULL,
    "recoveredAmountPaise" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL,
    "falseIntervention" BOOLEAN NOT NULL,
    "policyStopped" BOOLEAN NOT NULL,
    "customerContacted" BOOLEAN NOT NULL,
    "dataSource" "DataSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationOutcome_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SimulationOutcome_runId_strategy_paymentIndex_key"
ON "SimulationOutcome"("runId", "strategy", "paymentIndex");

CREATE INDEX "SimulationOutcome_runId_strategy_idx"
ON "SimulationOutcome"("runId", "strategy");

ALTER TABLE "SimulationOutcome"
ADD CONSTRAINT "SimulationOutcome_runId_fkey"
FOREIGN KEY ("runId") REFERENCES "SimulationRun"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
