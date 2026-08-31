import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { formatMoney, formatPercentage } from "@/lib/formatters";

import {
  frozenSimulationProof,
  proofStrip,
  safetyStrip,
  testModeProof,
} from "../content";
import styles from "./landing.module.css";

export function ProofBoundary() {
  const noIntervention = formatMoney(
    frozenSimulationProof.noInterventionRevenuePaise,
  );
  const naive = formatMoney(frozenSimulationProof.naiveRetryRevenuePaise);
  const recovered = formatMoney(frozenSimulationProof.recoveredRevenuePaise);
  const incremental = formatMoney(
    frozenSimulationProof.incrementalRevenuePaise,
  );
  const recoveryRate = formatPercentage(frozenSimulationProof.recoveryRateBps);
  const testAmount = formatMoney(testModeProof.amountPaise);

  return (
    <div className={styles.boundaryGrid}>
      <section aria-labelledby="safety-strip" className={styles.safetyPanel}>
        <p className={styles.safetyEyebrow}>Safety boundary</p>
        <h2 id="safety-strip">{safetyStrip.title}</h2>
        <p>{safetyStrip.body}</p>
        <ul className={styles.boundaryList}>
          {safetyStrip.boundaries.map((boundary) => (
            <li key={boundary}>
              <span aria-hidden="true" />
              {boundary}
            </li>
          ))}
        </ul>
        <p className={styles.safetyFootnote}>
          Advice and authority remain separate by design.
        </p>
      </section>

      <section aria-labelledby="proof-strip" className={styles.proofPanel}>
        <p className={styles.sectionEyebrow}>Evidence</p>
        <h2 id="proof-strip">{proofStrip.title}</h2>
        <p className={styles.proofIntro}>{proofStrip.body}</p>

        <div className={styles.proofComparison}>
          <div>
            <span>No intervention</span>
            <strong>{noIntervention}</strong>
          </div>
          <div>
            <span>Naive immediate retry</span>
            <strong>{naive}</strong>
          </div>
          <div data-highlight="true">
            <span>RecoveryOS</span>
            <strong>{recovered}</strong>
          </div>
        </div>

        <div className={styles.proofSummary}>
          <div>
            <span>Incremental uplift</span>
            <strong>+{incremental}</strong>
            <small>{recoveryRate} recovered across the frozen batch</small>
          </div>
          <DataSourceBadge source={frozenSimulationProof.label} />
        </div>

        <div className={styles.testProof}>
          <div>
            <span>Separate live-loop proof</span>
            <strong>{testAmount} paid</strong>
            <small>{testModeProof.outcome}.</small>
          </div>
          <DataSourceBadge source={testModeProof.label} />
        </div>

        <p className={styles.evidenceMeta}>
          Seed {frozenSimulationProof.seed} · hash{" "}
          {frozenSimulationProof.configurationHash} ·{" "}
          {frozenSimulationProof.paymentCount} payments. Neither proof
          represents live merchant revenue.
        </p>
      </section>
    </div>
  );
}
