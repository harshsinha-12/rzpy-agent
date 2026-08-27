import { reportedIssueWorkflow } from "../content";
import styles from "./recoveries.module.css";

export function RecoveryWorkflow() {
  return (
    <section
      aria-labelledby="recovery-workflow-heading"
      className={`surface ${styles.workflow}`}
    >
      <div className={styles.workflowIntro}>
        <p className={styles.workflowEyebrow}>How a reported issue moves</p>
        <h2 className={styles.workflowTitle} id="recovery-workflow-heading">
          Detect → Diagnose → Decide → Guard → Execute → Observe
        </h2>
        <p className={styles.workflowCopy}>
          Each row is one failed payment in that loop. AI can propose the next
          step. Deterministic policy decides whether it may run. Open a case to
          see the audit trail.
        </p>
      </div>
      <ol className={styles.workflowGrid}>
        {reportedIssueWorkflow.map((step) => (
          <li key={step.index}>
            <span>
              {step.index} · {step.column}
            </span>
            <strong>{step.title}</strong>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
