import Link from "next/link";

import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { formatMoney, formatPercentage } from "@/lib/formatters";

import {
  frozenSimulationProof,
  landingHero,
  landingSections,
  productMockups,
  proofStrip,
  recoveryLoopStages,
  safetyStrip,
  testModeProof,
} from "../content";
import styles from "./landing.module.css";

export function LandingPage() {
  const recovered = formatMoney(frozenSimulationProof.recoveredRevenuePaise);
  const atRisk = formatMoney(frozenSimulationProof.revenueAtRiskPaise);
  const incremental = formatMoney(
    frozenSimulationProof.incrementalRevenuePaise,
  );
  const recoveryRate = formatPercentage(frozenSimulationProof.recoveryRateBps);
  const testAmount = formatMoney(testModeProof.amountPaise);

  return (
    <div className={styles.page}>
      <section aria-labelledby="landing-brand" className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1 className={styles.brandMark} id="landing-brand">
            {landingHero.brand}
          </h1>
          <p className={styles.problem}>{landingHero.problem}</p>
          <p className={styles.promise}>{landingHero.promise}</p>
          <div className={styles.ctaRow}>
            <Link className={styles.ctaPrimary} href="/dashboard">
              {landingHero.ctaPrimary}
            </Link>
            <Link className={styles.ctaSecondary} href="/demo/checkout">
              {landingHero.ctaSecondary}
            </Link>
          </div>
        </div>

        <aside aria-label="Product preview" className={styles.heroFrame}>
          <div aria-hidden="true" className={styles.frameChrome}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.frameBody}>
            <p className={styles.frameLabel}>Illustrative control room</p>
            <p className={styles.frameTitle}>
              Failed payment → guarded recovery
            </p>
            <div className={styles.frameMetrics}>
              <div className={styles.frameMetric}>
                <span>At risk</span>
                <strong>{atRisk}</strong>
              </div>
              <div className={styles.frameMetric}>
                <span>Recovered</span>
                <strong>{recovered}</strong>
              </div>
              <div className={styles.frameMetric}>
                <span>Uplift</span>
                <strong>+{incremental}</strong>
              </div>
            </div>
            <div className={styles.badgeRow}>
              <DataSourceBadge source={frozenSimulationProof.label} />
              <span className={styles.badge}>Not live merchant revenue</span>
            </div>
          </div>
        </aside>
      </section>

      <section aria-labelledby="how-it-works-title" className={styles.section}>
        <p className={styles.sectionEyebrow}>
          {landingSections.howItWorks.eyebrow}
        </p>
        <h2 className={styles.sectionTitle} id="how-it-works-title">
          {landingSections.howItWorks.title}
        </h2>
        <ol className={styles.loopList}>
          {recoveryLoopStages.map((stage) => (
            <li className={styles.loopItem} key={stage.index}>
              <span>{stage.index}</span>
              <strong>{stage.title}</strong>
              <p>{stage.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="product-mockups" className={styles.section}>
        <p className={styles.sectionEyebrow}>
          {landingSections.mockups.eyebrow}
        </p>
        <h2 className={styles.sectionTitle} id="product-mockups">
          {landingSections.mockups.title}
        </h2>
        <div className={styles.mockupGrid}>
          <article className={styles.mockupCard}>
            <p className={styles.sectionEyebrow}>
              {productMockups.dashboard.eyebrow}
            </p>
            <h3>{productMockups.dashboard.title}</h3>
            <div className={styles.frameMetrics}>
              <div className={styles.frameMetric}>
                <span>Revenue at risk</span>
                <strong>{atRisk}</strong>
              </div>
              <div className={styles.frameMetric}>
                <span>Recovered</span>
                <strong>{recovered}</strong>
              </div>
              <div className={styles.frameMetric}>
                <span>Policy stops</span>
                <strong>{frozenSimulationProof.policyStops}</strong>
              </div>
            </div>
            <div className={styles.badgeRow}>
              <DataSourceBadge source={frozenSimulationProof.label} />
            </div>
          </article>

          <article className={styles.mockupCard}>
            <p className={styles.sectionEyebrow}>
              {productMockups.reportedIssue.eyebrow}
            </p>
            <h3>{productMockups.reportedIssue.title}</h3>
            <dl className={styles.issueRow}>
              <div>
                <dt>Method</dt>
                <dd>{productMockups.reportedIssue.method}</dd>
              </div>
              <div>
                <dt>Diagnosis</dt>
                <dd>{productMockups.reportedIssue.diagnosis}</dd>
              </div>
              <div>
                <dt>Proposed</dt>
                <dd>{productMockups.reportedIssue.action}</dd>
              </div>
              <div>
                <dt>Policy</dt>
                <dd>{productMockups.reportedIssue.policy}</dd>
              </div>
            </dl>
          </article>

          <article className={styles.mockupCard}>
            <p className={styles.sectionEyebrow}>
              {productMockups.caseTimeline.eyebrow}
            </p>
            <h3>{productMockups.caseTimeline.title}</h3>
            <div className={styles.timeline}>
              {productMockups.caseTimeline.steps.map((step) => (
                <div
                  className={styles.timelineStep}
                  data-state={step.state}
                  key={step.label}
                >
                  <span aria-hidden="true" className={styles.dot} />
                  {step.label}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <div className={styles.stripGrid}>
        <section aria-labelledby="safety-strip" className={styles.strip}>
          <p className={styles.sectionEyebrow}>Safety boundary</p>
          <h2 id="safety-strip">{safetyStrip.title}</h2>
          <p>{safetyStrip.body}</p>
        </section>

        <section aria-labelledby="proof-strip" className={styles.strip}>
          <p className={styles.sectionEyebrow}>Evidence</p>
          <h2 id="proof-strip">{proofStrip.title}</h2>
          <p>{proofStrip.body}</p>
          <div className={styles.proofFacts}>
            <div className={styles.proofFact}>
              <span>Frozen batch uplift</span>
              <strong>+{incremental}</strong>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>
                  {frozenSimulationProof.label}
                </span>
                <span className={styles.badge}>{recoveryRate} recovered</span>
              </div>
            </div>
            <div className={styles.proofFact}>
              <span>Live loop proof</span>
              <strong>{testAmount} paid</strong>
              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${styles.badgeTest}`}>
                  {testModeProof.label}
                </span>
              </div>
            </div>
          </div>
          <p className={styles.promise}>
            Seed {frozenSimulationProof.seed} · hash{" "}
            {frozenSimulationProof.configurationHash} ·{" "}
            {frozenSimulationProof.paymentCount} payments.{" "}
            {testModeProof.outcome}.
          </p>
        </section>
      </div>
    </div>
  );
}
