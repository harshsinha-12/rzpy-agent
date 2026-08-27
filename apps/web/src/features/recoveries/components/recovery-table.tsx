import Link from "next/link";

import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatLabel, formatMoney } from "@/lib/formatters";

import { recoveryHref, type RecoveryQuery } from "../query";
import type { RecoveryCaseListItem } from "../schemas";
import styles from "./recoveries.module.css";

function SortLink({
  field,
  label,
  query,
}: {
  field: RecoveryQuery["sortBy"];
  label: string;
  query: RecoveryQuery;
}) {
  const isActive = query.sortBy === field;
  const nextOrder = isActive && query.sortOrder === "desc" ? "asc" : "desc";

  return (
    <Link
      className={styles.sortLink}
      href={recoveryHref(query, {
        page: 1,
        sortBy: field,
        sortOrder: nextOrder,
      })}
    >
      {label}
      {isActive ? (
        <span className={styles.sortState}>
          {query.sortOrder === "asc" ? "Ascending" : "Descending"}
        </span>
      ) : null}
    </Link>
  );
}

function MobileCaseCard({ item }: { item: RecoveryCaseListItem }) {
  return (
    <article className={styles.mobileCard}>
      <div className={styles.mobileCardTop}>
        <Link className={styles.caseLink} href={`/recoveries/${item.caseId}`}>
          <span className={styles.caseLinkIds}>
            <span>{item.caseId}</span>
            <span className={styles.subtleId}>{item.paymentId}</span>
          </span>
          <span className={styles.caseLinkCue}>Open →</span>
        </Link>
        <StatusBadge value={item.recoveryStatus} />
      </div>
      <strong className={styles.money}>
        {formatMoney(item.amountAtRiskPaise, item.currency)}
      </strong>
      <div className={styles.mobileMeta}>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Method</span>
          <span className={styles.metaValue}>
            {formatLabel(item.paymentMethod)}
          </span>
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Failure</span>
          <span className={styles.metaValue}>
            {formatLabel(item.failureReason ?? item.failureCategory)}
          </span>
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Action</span>
          <span className={styles.metaValue}>
            {item.proposedAction ? formatLabel(item.proposedAction) : "—"}
          </span>
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Updated</span>
          <span className={styles.metaValue}>
            {formatDateTime(item.lastUpdatedAt)}
          </span>
        </span>
      </div>
      <DataSourceBadge source={item.dataSource} />
    </article>
  );
}

export function RecoveryTable({
  items,
  query,
}: {
  items: RecoveryCaseListItem[];
  query: RecoveryQuery;
}) {
  if (items.length === 0) {
    return (
      <section className={`surface ${styles.empty}`}>
        <div>
          <h2>No recovery cases match these filters</h2>
          <p>
            Reset the current filters or search with a payment, order, or case
            identifier.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`surface ${styles.tableSurface}`}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Payment / case</th>
              <th>Order</th>
              <th>
                <SortLink
                  field="amountAtRiskPaise"
                  label="Amount"
                  query={query}
                />
              </th>
              <th>Method</th>
              <th>Source</th>
              <th>Reason</th>
              <th>Recovery state</th>
              <th>Proposed action</th>
              <th>Policy</th>
              <th>Data source</th>
              <th>
                <SortLink
                  field="lastUpdatedAt"
                  label="Last update"
                  query={query}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.caseId}>
                <td>
                  <Link
                    className={styles.caseLink}
                    href={`/recoveries/${item.caseId}`}
                  >
                    <span className={styles.caseLinkIds}>
                      <span>{item.paymentId}</span>
                      <span className={styles.subtleId}>{item.caseId}</span>
                    </span>
                    <span className={styles.caseLinkCue}>Open →</span>
                  </Link>
                </td>
                <td className={styles.subtleId}>{item.orderId}</td>
                <td className={styles.money}>
                  {formatMoney(item.amountAtRiskPaise, item.currency)}
                </td>
                <td>{formatLabel(item.paymentMethod)}</td>
                <td>{formatLabel(item.failureSource ?? "Unknown")}</td>
                <td>
                  <span
                    className={styles.reason}
                    title={item.failureReason ?? item.failureCategory}
                  >
                    {formatLabel(item.failureReason ?? item.failureCategory)}
                  </span>
                </td>
                <td>
                  <StatusBadge value={item.recoveryStatus} />
                </td>
                <td>
                  {item.proposedAction ? formatLabel(item.proposedAction) : "—"}
                </td>
                <td>
                  {item.policyDecision ? (
                    <StatusBadge value={item.policyDecision} />
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <DataSourceBadge source={item.dataSource} />
                </td>
                <td>{formatDateTime(item.lastUpdatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.mobileCards}>
        {items.map((item) => (
          <MobileCaseCard item={item} key={item.caseId} />
        ))}
      </div>
    </section>
  );
}
