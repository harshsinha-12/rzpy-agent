import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { formatMoney } from "@/lib/formatters";

import {
  frozenSimulationProof,
  landingSections,
  productMockups,
} from "../content";
import styles from "./landing.module.css";

function WindowBar({ label }: { label: string }) {
  return (
    <div className={styles.productWindowBar}>
      <div aria-hidden="true" className={styles.frameChrome}>
        <span />
        <span />
        <span />
      </div>
      <span className={styles.windowTitle}>{label}</span>
      <span className={styles.windowStatus}>Illustrative</span>
    </div>
  );
}

export function ProductSurfaces() {
  const atRisk = formatMoney(frozenSimulationProof.revenueAtRiskPaise);
  const recovered = formatMoney(frozenSimulationProof.recoveredRevenuePaise);
  const naive = formatMoney(frozenSimulationProof.naiveRetryRevenuePaise);

  return (
    <section aria-labelledby="product-mockups" className={styles.section}>
      <div className={styles.sectionHeadingRow}>
        <div>
          <p className={styles.sectionEyebrow}>
            {landingSections.mockups.eyebrow}
          </p>
          <h2 className={styles.sectionTitle} id="product-mockups">
            {landingSections.mockups.title}
          </h2>
        </div>
        <p className={styles.sectionIntro}>{landingSections.mockups.intro}</p>
      </div>

      <div className={styles.surfaceGrid}>
        <article
          className={`${styles.productWindow} ${styles.dashboardMockup}`}
        >
          <WindowBar label="Executive dashboard" />
          <div className={styles.windowBody}>
            <div className={styles.mockupHeader}>
              <div>
                <p className={styles.sectionEyebrow}>
                  {productMockups.dashboard.eyebrow}
                </p>
                <h3>{productMockups.dashboard.title}</h3>
              </div>
              <DataSourceBadge source={frozenSimulationProof.label} />
            </div>

            <div className={styles.dashboardMetricGrid}>
              <div>
                <span>Revenue at risk</span>
                <strong>{atRisk}</strong>
              </div>
              <div>
                <span>Recovered</span>
                <strong>{recovered}</strong>
              </div>
              <div>
                <span>Policy stops</span>
                <strong>{frozenSimulationProof.policyStops}</strong>
              </div>
            </div>

            <div className={styles.strategyPanel}>
              <div className={styles.strategyHeader}>
                <span>Strategy comparison</span>
                <span>Recovered revenue</span>
              </div>
              <div className={styles.strategyRow}>
                <span>Naive immediate retry</span>
                <div className={styles.strategyTrack}>
                  <span data-strategy="naive" />
                </div>
                <strong>{naive}</strong>
              </div>
              <div className={styles.strategyRow}>
                <span>RecoveryOS</span>
                <div className={styles.strategyTrack}>
                  <span data-strategy="recovery" />
                </div>
                <strong>{recovered}</strong>
              </div>
            </div>

            <div className={styles.dashboardFootnote}>
              <span>{frozenSimulationProof.escalations} escalations</span>
              <span>
                {frozenSimulationProof.preventedUnnecessaryInterventions}{" "}
                unnecessary interventions prevented
              </span>
            </div>
          </div>
        </article>

        <article className={`${styles.productWindow} ${styles.issueMockup}`}>
          <WindowBar label="Reported Issues" />
          <div className={styles.windowBody}>
            <div className={styles.mockupHeader}>
              <div>
                <p className={styles.sectionEyebrow}>
                  {productMockups.reportedIssue.eyebrow}
                </p>
                <h3>{productMockups.reportedIssue.title}</h3>
              </div>
              <span className={styles.statusPill}>
                {productMockups.reportedIssue.state}
              </span>
            </div>

            <div className={styles.issueSummary}>
              <div className={styles.issuePrimary}>
                <span>Failure diagnosis</span>
                <strong>{productMockups.reportedIssue.diagnosis}</strong>
                <small>
                  {productMockups.reportedIssue.method} · customer-side
                  authentication
                </small>
              </div>
              <DataSourceBadge source={productMockups.reportedIssue.source} />
            </div>

            <dl className={styles.decisionList}>
              <div>
                <dt>AI recommendation</dt>
                <dd>{productMockups.reportedIssue.action}</dd>
              </div>
              <div>
                <dt>Deterministic policy</dt>
                <dd>{productMockups.reportedIssue.policy}</dd>
              </div>
              <div>
                <dt>Next system action</dt>
                <dd>Wait for cooldown, then recheck payment state</dd>
              </div>
            </dl>

            <div className={styles.policyNote}>
              <span>Policy owns execution</span>
              <p>The model cannot create the link or contact the customer.</p>
            </div>
          </div>
        </article>

        <article className={`${styles.productWindow} ${styles.timelineMockup}`}>
          <WindowBar label="Recovery case audit" />
          <div className={styles.timelineLayout}>
            <div className={styles.timelineSummary}>
              <p className={styles.sectionEyebrow}>
                {productMockups.caseTimeline.eyebrow}
              </p>
              <h3>{productMockups.caseTimeline.title}</h3>
              <p>
                The operator can see the evidence, recommendation,
                authorization, execution, and verified provider outcome in one
                place.
              </p>
              <span className={styles.recoveredPill}>Verified recovered</span>
            </div>

            <ol className={styles.auditTimeline}>
              <li>
                <span className={styles.auditIndex}>01</span>
                <div>
                  <strong>Failure detected</strong>
                  <p>Signed provider event persisted once.</p>
                </div>
                <small>API</small>
              </li>
              <li>
                <span className={styles.auditIndex}>02</span>
                <div>
                  <strong>Action proposed</strong>
                  <p>
                    Read-only case facts produced one structured recommendation.
                  </p>
                </div>
                <small>AI</small>
              </li>
              <li>
                <span className={styles.auditIndex}>03</span>
                <div>
                  <strong>Execution guarded</strong>
                  <p>
                    Consent, cooldown, duplicates, and payment state passed.
                  </p>
                </div>
                <small>Policy</small>
              </li>
              <li data-state="active">
                <span className={styles.auditIndex}>04</span>
                <div>
                  <strong>Outcome verified</strong>
                  <p>Provider state rechecked and written to the timeline.</p>
                </div>
                <small>Razorpay</small>
              </li>
            </ol>
          </div>
        </article>
      </div>
    </section>
  );
}
