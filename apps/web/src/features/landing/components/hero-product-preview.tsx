import type { CSSProperties } from "react";

import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { formatMoney } from "@/lib/formatters";

import {
  frozenSimulationProof,
  productMockups,
  testModeProof,
} from "../content";
import styles from "./landing.module.css";

export function HeroProductPreview() {
  const atRisk = formatMoney(frozenSimulationProof.revenueAtRiskPaise);
  const incremental = formatMoney(
    frozenSimulationProof.incrementalRevenuePaise,
  );

  return (
    <aside
      aria-label="Illustrative RecoveryOS control room"
      className={styles.heroFrame}
    >
      <div className={styles.productWindowBar}>
        <div aria-hidden="true" className={styles.frameChrome}>
          <span />
          <span />
          <span />
        </div>
        <span className={styles.windowTitle}>Recovery control room</span>
        <span className={styles.windowStatus}>Live workflow</span>
      </div>

      <div className={styles.heroDashboard}>
        <div className={styles.liveSignal}>
          <span aria-hidden="true" className={styles.liveSignalDot} />
          <span>Recovery event moving through policy</span>
          <small>Audited live</small>
        </div>

        <div className={styles.heroDashboardHeader}>
          <div>
            <p className={styles.frameLabel}>Revenue under recovery</p>
            <strong className={styles.heroMetric}>{atRisk}</strong>
          </div>
          <div className={styles.heroUplift}>
            <span>Incremental uplift</span>
            <strong>+{incremental}</strong>
          </div>
        </div>

        <div className={styles.heroCase}>
          <div className={styles.heroCaseHeader}>
            <div>
              <span className={styles.caseKicker}>Active recovery case</span>
              <strong>{productMockups.reportedIssue.diagnosis}</strong>
            </div>
            <DataSourceBadge source={productMockups.reportedIssue.source} />
          </div>

          <div className={styles.caseDecisionGrid}>
            <div>
              <span>Method</span>
              <strong>{productMockups.reportedIssue.method}</strong>
            </div>
            <div>
              <span>AI proposed</span>
              <strong>{productMockups.reportedIssue.action}</strong>
            </div>
            <div>
              <span>Policy</span>
              <strong>{productMockups.reportedIssue.policy}</strong>
            </div>
          </div>

          <ol aria-label="Recovery progress" className={styles.heroProgress}>
            {productMockups.caseTimeline.steps.map((step, index) => (
              <li
                data-state={step.state}
                key={step.label}
                style={{ "--progress-index": index } as CSSProperties}
              >
                <span aria-hidden="true" />
                {step.label}
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.heroProofLine}>
          <DataSourceBadge source={frozenSimulationProof.label} />
          <span>
            Frozen batch evidence · {frozenSimulationProof.paymentCount}{" "}
            payments
          </span>
          <strong>
            {formatMoney(testModeProof.amountPaise)} Test Mode proof
          </strong>
        </div>
      </div>
    </aside>
  );
}
