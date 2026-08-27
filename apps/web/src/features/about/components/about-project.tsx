import Link from "next/link";

import {
  challengeProof,
  deliveryProof,
  integrationCards,
  recoveryStages,
} from "../content";
import { ArchitectureDiagram } from "./architecture-diagram";
import styles from "./about.module.css";

export function AboutProject() {
  return (
    <div className={styles.aboutStack}>
      <section aria-labelledby="project-summary" className={styles.introGrid}>
        <div>
          <p className={styles.sectionEyebrow}>The simple version</p>
          <h2 className={styles.sectionTitle} id="project-summary">
            A decision layer for revenue that would otherwise be lost.
          </h2>
        </div>
        <div className={styles.introCopy}>
          <p>
            Razorpay already tells a merchant that a payment failed. RecoveryOS
            answers the harder next question: should the system wait, offer
            another path, create a recovery link, contact the customer, escalate
            the issue, or stop?
          </p>
          <p>
            Every recommendation is explained, every action is checked by
            deterministic policy, and every result is stored so the merchant can
            see what recovered and why.
          </p>
        </div>
      </section>

      <section aria-labelledby="challenge-fit" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>Razorpay challenge fit</p>
            <h2 className={styles.sectionTitle} id="challenge-fit">
              Payment degradation → root cause → recovery action.
            </h2>
          </div>
          <p>
            RecoveryOS deliberately completes one revenue-recovery direction end
            to end: detect the loss, determine the intervention, execute within
            policy, and prove the outcome with measured money and an audit
            trail.
          </p>
        </div>
        <div className={styles.proofGrid}>
          {challengeProof.map((proof) => (
            <article key={proof.label}>
              <span>{proof.label}</span>
              <h3>{proof.title}</h3>
              <p>{proof.detail}</p>
            </article>
          ))}
        </div>
        <p className={styles.scopeNote}>
          Checkout abandonment, subscription recovery, B2B receivables, mandate
          sequencing, voice recovery, and promise-to-pay tracking remain out of
          scope. The failed-payment loop is the complete first version.
        </p>
      </section>

      <section aria-labelledby="recovery-loop" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>How it works</p>
            <h2 className={styles.sectionTitle} id="recovery-loop">
              One accountable recovery loop.
            </h2>
          </div>
          <p>
            The model advises. Deterministic code decides what is allowed. The
            execution layer alone can create a side effect.
          </p>
        </div>
        <ol className={styles.stageGrid}>
          {recoveryStages.map((stage) => (
            <li key={stage.index}>
              <span>{stage.index}</span>
              <strong>{stage.title}</strong>
              <p>{stage.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="architecture" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>System architecture</p>
            <h2 className={styles.sectionTitle} id="architecture">
              From payment failure to verified outcome.
            </h2>
          </div>
          <p>
            PostgreSQL keeps the business truth. Redis and BullMQ keep work
            moving. The worker connects diagnosis, AI, policy, provider tools,
            and verification.
          </p>
        </div>
        <ArchitectureDiagram />
        <div className={styles.cronNote}>
          <strong>No external cron service or dedicated VM is required.</strong>
          <span>
            A BullMQ repeatable scheduler runs reconciliation every 60 seconds
            while the worker is online, recovering stale webhooks, overdue
            actions, and cases waiting for analysis.
          </span>
        </div>
      </section>

      <section aria-labelledby="integrations" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>What is integrated</p>
            <h2 className={styles.sectionTitle} id="integrations">
              Real components, narrow responsibilities.
            </h2>
          </div>
          <p>
            Test Mode and simulated records are visibly labelled so a demo
            outcome can never be mistaken for real merchant revenue.
          </p>
        </div>
        <div className={styles.integrationGrid}>
          {integrationCards.map((integration) => (
            <article key={integration.title}>
              <span>{integration.label}</span>
              <h3>{integration.title}</h3>
              <p>{integration.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="delivery-proof" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.sectionEyebrow}>Judge-ready proof</p>
            <h2 className={styles.sectionTitle} id="delivery-proof">
              From healthy infrastructure to judge-ready proof.
            </h2>
          </div>
          <p>
            Each gate is verified. Live Razorpay Test Mode evidence stays
            separate from the labelled simulated batch comparison.
          </p>
        </div>
        <ol className={styles.roadmapGrid}>
          {deliveryProof.map((item) => (
            <li key={item.step}>
              <span>
                {item.step} · {item.status}
              </span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Project safety principles" className={styles.closer}>
        <div>
          <p className={styles.sectionEyebrow}>The important boundary</p>
          <h2>AI can propose. It cannot move money.</h2>
          <p>
            RecoveryOS gives GPT-5.6 Terra read-only case context. It cannot
            write to PostgreSQL, call Razorpay, or message a customer. Those
            capabilities stay behind deterministic policy and auditable tools.
          </p>
        </div>
        <div className={styles.closerLinks}>
          <Link href="/">Review the dashboard →</Link>
          <Link href="/recoveries">Explore Reported Issues →</Link>
          <Link href="/demo/checkout">Open Test Mode checkout →</Link>
        </div>
      </section>
    </div>
  );
}
