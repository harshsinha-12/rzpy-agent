import Link from "next/link";

import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatLabel, formatMoney } from "@/lib/formatters";

import type { RecoveryCaseDetail } from "../schemas";
import styles from "./recovery-detail.module.css";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={styles.factValue}>{value}</dd>
    </div>
  );
}

export function RecoveryDetail({ recovery }: { recovery: RecoveryCaseDetail }) {
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <Link className={styles.backLink} href="/recoveries">
            Back to reported issues
          </Link>
          <p className="eyebrow">Recovery case {recovery.caseId}</p>
          <div className={styles.titleRow}>
            <h1 className="page-title">
              Explain the failure.
              <br />
              <span className="title-accent">Show every decision.</span>
            </h1>
            <StatusBadge value={recovery.recoveryStatus} />
          </div>
          <p className="page-description">
            A normalized payment record, the proposed recovery path, and the
            complete audit trail behind it.
          </p>
        </div>
      </header>

      <div className={styles.sourceRow}>
        <DataSourceBadge source={recovery.dataSource} />
        <span>Last updated {formatDateTime(recovery.lastUpdatedAt)}</span>
      </div>

      <section aria-label="Case summary" className={styles.summaryGrid}>
        <article className={`surface ${styles.summaryCard}`}>
          <span className={styles.summaryLabel}>Amount at risk</span>
          <strong className={styles.summaryValue}>
            {formatMoney(recovery.amountAtRiskPaise, recovery.currency)}
          </strong>
          <span className={styles.summaryHint}>{recovery.paymentId}</span>
        </article>
        <article className={`surface ${styles.summaryCard}`}>
          <span className={styles.summaryLabel}>Recoverability</span>
          <strong className={styles.summaryValue}>
            {recovery.recoverabilityScore}/100
          </strong>
          <span className={styles.summaryHint}>
            {formatLabel(recovery.recoverabilityBand)} confidence band
          </span>
        </article>
        <article className={`surface ${styles.summaryCard}`}>
          <span className={styles.summaryLabel}>Proposed action</span>
          <strong className={styles.summaryValueSmall}>
            {recovery.proposedAction
              ? formatLabel(recovery.proposedAction)
              : "No action proposed"}
          </strong>
          <span className={styles.summaryHint}>Policy-controlled</span>
        </article>
        <article className={`surface ${styles.summaryCard}`}>
          <span className={styles.summaryLabel}>Recovered value</span>
          <strong className={styles.summaryValue}>
            {formatMoney(recovery.recoveredAmountPaise, recovery.currency)}
          </strong>
          <span className={styles.summaryHint}>
            {recovery.closedAt
              ? `Closed ${formatDateTime(recovery.closedAt)}`
              : "Case remains open"}
          </span>
        </article>
      </section>

      <div className={styles.detailGrid}>
        <div className={styles.column}>
          <section className={`surface ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Diagnosis and evidence</h2>
                <p className={styles.panelSubtitle}>
                  The normalized cause behind this failed payment.
                </p>
              </div>
              <StatusBadge value={recovery.failureCategory} />
            </div>
            <p className={styles.diagnosis}>{recovery.diagnosis}</p>
            <dl className={styles.facts}>
              <Fact label="Payment ID" value={recovery.payment.paymentId} />
              <Fact label="Order ID" value={recovery.payment.orderId} />
              <Fact
                label="Payment method"
                value={formatLabel(recovery.payment.method)}
              />
              <Fact
                label="Payment status"
                value={formatLabel(recovery.payment.status)}
              />
              <Fact
                label="Failure source"
                value={formatLabel(recovery.payment.errorSource ?? "Unknown")}
              />
              <Fact
                label="Failure step"
                value={formatLabel(recovery.payment.errorStep ?? "Unknown")}
              />
              <Fact
                label="Failure reason"
                value={formatLabel(
                  recovery.payment.errorReason ?? recovery.failureCategory,
                )}
              />
              <Fact
                label="Occurred"
                value={formatDateTime(recovery.payment.occurredAt)}
              />
            </dl>
          </section>

          <section className={`surface ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Recovery actions</h2>
                <p className={styles.panelSubtitle}>
                  Recommendations remain separate from policy approval and
                  execution.
                </p>
              </div>
            </div>
            <div className={styles.actionList}>
              {recovery.actions.length > 0 ? (
                recovery.actions.map((action) => (
                  <article className={styles.action} key={action.id}>
                    <div className={styles.actionHeader}>
                      <strong className={styles.actionTitle}>
                        Attempt {action.attemptNumber}:{" "}
                        {formatLabel(action.actionType)}
                      </strong>
                      <StatusBadge value={action.result} />
                    </div>
                    <p className={styles.actionReason}>{action.reason}</p>
                    <div className={styles.policy}>
                      <StatusBadge value={action.policyDecision} />
                      <span className={styles.policyReason}>
                        {action.policyReason}
                      </span>
                    </div>
                    <div className={styles.actionMeta}>
                      <span>{action.confidence}% confidence</span>
                      <span>Proposed by {formatLabel(action.proposedBy)}</span>
                      <span>{formatDateTime(action.createdAt)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className={styles.panelSubtitle}>
                  No recovery action has been proposed for this case.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className={styles.column}>
          <section className={`surface ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Customer context</h2>
                <p className={styles.panelSubtitle}>
                  The minimum identity and consent context used by policy.
                </p>
              </div>
            </div>
            <dl className={styles.factsSingle}>
              <Fact label="Customer" value={recovery.customer.name} />
              <Fact
                label="External reference"
                value={recovery.customer.externalRef}
              />
              <Fact
                label="Contact preference"
                value={
                  recovery.customer.optedOut ? "Opted out" : "Contact allowed"
                }
              />
            </dl>
          </section>

          <section className={`surface ${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Decision trail</h2>
                <p className={styles.panelSubtitle}>
                  A chronological, inspectable audit of this recovery case.
                </p>
              </div>
            </div>
            <ol className={styles.timeline}>
              {recovery.auditTimeline.map((event, index) => (
                <li className={styles.timelineItem} key={event.id}>
                  <span className={styles.eventIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className={styles.timelineBody}>
                    <strong className={styles.eventTitle}>
                      {formatLabel(event.eventType)}
                    </strong>
                    <span className={styles.time}>
                      {formatDateTime(event.occurredAt)} ·{" "}
                      {formatLabel(event.actor)}
                    </span>
                    {event.reasoning ? (
                      <p className={styles.eventReasoning}>{event.reasoning}</p>
                    ) : null}
                    {event.decision ? (
                      <span className={styles.eventDecision}>
                        Decision: {formatLabel(event.decision)}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
