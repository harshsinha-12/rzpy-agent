import { queueSteps } from "../content";
import styles from "./about.module.css";

function Arrow({ label }: { label: string }) {
  return (
    <div aria-hidden="true" className={styles.arrow}>
      <span>↓</span>
      <small>{label}</small>
    </div>
  );
}

export function ArchitectureDiagram() {
  return (
    <div className={styles.architectureFrame}>
      <div className={styles.sourceGrid}>
        <article className={styles.architectureNode}>
          <span className={styles.nodeLabel}>Merchant experience</span>
          <strong>Next.js frontend</strong>
          <p>
            Dashboard, Reported Issues, case detail, and Test Mode checkout.
          </p>
        </article>
        <article className={styles.architectureNode}>
          <span className={styles.nodeLabel}>Payment provider</span>
          <strong>Razorpay Test Mode</strong>
          <p>Orders, signed events, payment state, and silent Payment Links.</p>
        </article>
      </div>

      <Arrow label="HTTPS requests + signed webhooks" />

      <article className={`${styles.architectureNode} ${styles.primaryNode}`}>
        <span className={styles.nodeLabel}>Application boundary</span>
        <strong>Fastify API</strong>
        <p>
          Validates requests, persists webhook events, serves product data, and
          enqueues background work.
        </p>
      </article>

      <Arrow label="durable records + asynchronous jobs" />

      <div className={styles.stateGrid}>
        <article className={styles.architectureNode}>
          <span className={styles.nodeLabel}>Durable source of truth</span>
          <strong>PostgreSQL + Prisma</strong>
          <p>Cases, actions, policies, jobs, outcomes, and audit history.</p>
        </article>
        <article className={styles.architectureNode}>
          <span className={styles.nodeLabel}>Job infrastructure</span>
          <strong>Redis + BullMQ</strong>
          <p>
            Delayed jobs, retries, stable IDs, and the repeatable scheduler.
          </p>
        </article>
      </div>

      <Arrow label="the continuously running worker consumes each queue" />

      <div className={styles.workerPanel}>
        <div className={styles.workerHeader}>
          <div>
            <span className={styles.nodeLabel}>Background runtime</span>
            <strong>Recovery worker</strong>
          </div>
          <span className={styles.schedulerBadge}>
            Reconciliation every 60 seconds
          </span>
        </div>
        <ol className={styles.queueFlow}>
          {queueSteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </div>

      <Arrow label="read facts → propose → approve or deny" />

      <div className={styles.decisionGrid}>
        <article className={styles.architectureNode}>
          <span className={styles.nodeLabel}>Explainable facts</span>
          <strong>Diagnosis engine</strong>
          <p>Classifies failure cause and provides a safe fallback.</p>
        </article>
        <article className={`${styles.architectureNode} ${styles.aiNode}`}>
          <span className={styles.nodeLabel}>Advisory intelligence</span>
          <strong>OpenAI · GPT-5.6 Terra</strong>
          <p>Proposes one structured action. It has no execution tools.</p>
        </article>
        <article className={styles.architectureNode}>
          <span className={styles.nodeLabel}>Deterministic authority</span>
          <strong>Policy engine</strong>
          <p>Checks safety, consent, limits, cooldowns, and duplicates.</p>
        </article>
      </div>

      <Arrow label="only approved actions reach provider tools" />

      <article className={`${styles.architectureNode} ${styles.outcomeNode}`}>
        <span className={styles.nodeLabel}>Controlled side effects</span>
        <strong>Razorpay tools → verification → audit timeline</strong>
        <p>
          The worker re-checks payment state, executes a bounded action,
          verifies the result, and sends the updated truth back to the product.
        </p>
      </article>
    </div>
  );
}
