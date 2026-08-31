"use client";

import { useState } from "react";

import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/formatters";

import {
  checkoutDropOffsResponseSchema,
  type CheckoutDropOff,
} from "../schemas";
import styles from "./dropoffs.module.css";

function DropOffActions({
  busyId,
  copiedId,
  error,
  item,
  onCopy,
  onPrepare,
}: {
  busyId: string | null;
  copiedId: string | null;
  error: string | null;
  item: CheckoutDropOff;
  onCopy: (item: CheckoutDropOff) => void;
  onPrepare: (item: CheckoutDropOff) => void;
}) {
  return (
    <div className={styles.actions}>
      {item.status === "OPEN" ? (
        <button
          className={styles.primaryButton}
          disabled={busyId === item.caseId}
          onClick={() => onPrepare(item)}
          type="button"
        >
          {busyId === item.caseId ? "Preparing…" : "Prepare email"}
        </button>
      ) : item.draftBody ? (
        <>
          <button
            className={styles.secondaryButton}
            onClick={() => onCopy(item)}
            type="button"
          >
            {copiedId === item.caseId ? "Copied" : "Copy email"}
          </button>
          <details className={styles.preview}>
            <summary>Preview draft</summary>
            <pre>
              {item.draftSubject ? `Subject: ${item.draftSubject}\n\n` : ""}
              {item.draftBody}
            </pre>
          </details>
        </>
      ) : (
        <span className={styles.subtleId}>Policy stopped</span>
      )}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

function MobileDropOffCard({
  busyId,
  copiedId,
  error,
  item,
  onCopy,
  onPrepare,
}: {
  busyId: string | null;
  copiedId: string | null;
  error: string | null;
  item: CheckoutDropOff;
  onCopy: (item: CheckoutDropOff) => void;
  onPrepare: (item: CheckoutDropOff) => void;
}) {
  return (
    <article className={styles.mobileCard}>
      <div className={styles.mobileCardTop}>
        <div className={styles.stack}>
          <span className={styles.primary}>{item.caseId}</span>
          <span className={styles.subtleId}>{item.orderId}</span>
        </div>
        <StatusBadge value={item.status} />
      </div>
      <strong className={styles.money}>
        {formatMoney(item.amountPaise, item.currency)}
      </strong>
      <div className={styles.mobileMeta}>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Customer</span>
          <span className={styles.metaValue}>{item.customer.name}</span>
        </span>
        <span className={styles.metaItem}>
          <span className={styles.metaLabel}>Email</span>
          <span className={styles.metaValue}>
            {item.customer.email ?? "No eligible email"}
          </span>
        </span>
      </div>
      <p className={styles.reason}>
        {item.policyReason ?? "Awaiting merchant selection"}
      </p>
      <DataSourceBadge source={item.dataSource} />
      <DropOffActions
        busyId={busyId}
        copiedId={copiedId}
        error={error}
        item={item}
        onCopy={onCopy}
        onPrepare={onPrepare}
      />
    </article>
  );
}

export function DropOffList({
  initialItems,
}: {
  initialItems: CheckoutDropOff[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function createDraft(item: CheckoutDropOff): Promise<boolean> {
    setBusyId(item.caseId);
    setErrorById((current) => {
      const next = { ...current };
      delete next[item.caseId];
      return next;
    });
    try {
      const response = await fetch(
        `/api/checkout/drop-offs/${encodeURIComponent(item.caseId)}/draft`,
        { method: "POST" },
      );
      const body: unknown = await response.json();
      const parsed = checkoutDropOffsResponseSchema
        .pick({ data: true })
        .safeParse({ data: [(body as { data?: unknown })?.data] });
      const updated = parsed.success ? parsed.data.data[0] : undefined;
      if (!response.ok || !updated) {
        throw new Error("Could not prepare the email draft.");
      }
      setItems((current) =>
        current.map((entry) =>
          entry.caseId === item.caseId ? updated : entry,
        ),
      );
      return true;
    } catch {
      setErrorById((current) => ({
        ...current,
        [item.caseId]: "Could not prepare the email draft.",
      }));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function prepareSelected() {
    const selected = items.filter((item) => selectedIds.includes(item.caseId));
    for (const item of selected) await createDraft(item);
    setSelectedIds([]);
  }

  async function copyDraft(item: CheckoutDropOff) {
    if (!item.draftSubject || !item.draftBody) return;
    await navigator.clipboard.writeText(
      `To: ${item.customer.email ?? ""}\nSubject: ${item.draftSubject}\n\n${item.draftBody}`,
    );
    setCopiedId(item.caseId);
  }

  return (
    <section className={`surface ${styles.panel}`}>
      <header className={styles.intro}>
        <p className="eyebrow">Checkout drop-offs</p>
        <h2 className={styles.introTitle}>Prepare a recovery email</h2>
        <p className={styles.introCopy}>
          No email is sent by RecoveryOS. Select an unpaid checkout to create an
          auditable, copyable draft; connect a provider later to deliver it.
        </p>
      </header>
      {items.some((item) => item.status === "OPEN") ? (
        <div className={styles.bulkActions}>
          <p>
            {selectedIds.length} checkout{selectedIds.length === 1 ? "" : "s"}{" "}
            selected
          </p>
          <button
            className={styles.primaryButton}
            disabled={selectedIds.length === 0 || busyId !== null}
            onClick={() => void prepareSelected()}
            type="button"
          >
            Prepare selected drafts
          </button>
        </div>
      ) : null}
      {items.length === 0 ? (
        <div className={styles.empty}>
          <div>
            <h2>No unpaid checkouts yet</h2>
            <p>
              Drop-off cases stay off the Reported Issues table. Once unpaid
              orders are seeded or ingested, they will appear here for merchant
              selection.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th aria-label="Select">Select</th>
                  <th>Checkout</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Draft status</th>
                  <th>Data source</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.caseId}>
                    <td>
                      {item.status === "OPEN" ? (
                        <input
                          aria-label={`Select ${item.caseId}`}
                          checked={selectedIds.includes(item.caseId)}
                          onChange={(event) =>
                            setSelectedIds((current) =>
                              event.target.checked
                                ? [...current, item.caseId]
                                : current.filter((id) => id !== item.caseId),
                            )
                          }
                          type="checkbox"
                        />
                      ) : null}
                    </td>
                    <td>
                      <div className={styles.stack}>
                        <span className={styles.primary}>{item.caseId}</span>
                        <span className={styles.subtleId}>{item.orderId}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.stack}>
                        <span className={styles.primary}>
                          {item.customer.name}
                        </span>
                        <span className={styles.subtleId}>
                          {item.customer.email ?? "No eligible email"}
                        </span>
                      </div>
                    </td>
                    <td className={styles.money}>
                      {formatMoney(item.amountPaise, item.currency)}
                    </td>
                    <td>
                      <div className={styles.statusCell}>
                        <StatusBadge value={item.status} />
                        <span className={styles.reason}>
                          {item.policyReason ?? "Awaiting merchant selection"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <DataSourceBadge source={item.dataSource} />
                    </td>
                    <td>
                      <DropOffActions
                        busyId={busyId}
                        copiedId={copiedId}
                        error={errorById[item.caseId] ?? null}
                        item={item}
                        onCopy={(next) => void copyDraft(next)}
                        onPrepare={(next) => void createDraft(next)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.mobileCards}>
            {items.map((item) => (
              <MobileDropOffCard
                busyId={busyId}
                copiedId={copiedId}
                error={errorById[item.caseId] ?? null}
                item={item}
                key={item.caseId}
                onCopy={(next) => void copyDraft(next)}
                onPrepare={(next) => void createDraft(next)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
