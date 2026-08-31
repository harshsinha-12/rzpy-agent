"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/formatters";
import {
  checkoutDropOffsResponseSchema,
  type CheckoutDropOff,
} from "../schemas";

export function DropOffList({
  initialItems,
}: {
  initialItems: CheckoutDropOff[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function createDraft(item: CheckoutDropOff) {
    setBusyId(item.caseId);
    try {
      const response = await fetch(
        `/api/checkout/drop-offs/${encodeURIComponent(item.caseId)}/draft`,
        { method: "POST" },
      );
      const body: unknown = await response.json();
      const parsed = checkoutDropOffsResponseSchema
        .pick({ data: true })
        .safeParse({ data: [(body as { data?: unknown })?.data] });
      if (!response.ok || !parsed.success)
        throw new Error("Could not prepare the email draft.");
      const updated = parsed.data.data[0];
      if (!updated) throw new Error("Could not prepare the email draft.");
      setItems((current) =>
        current.map((entry) =>
          entry.caseId === item.caseId ? updated : entry,
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function copyDraft(item: CheckoutDropOff) {
    if (!item.draftSubject || !item.draftBody) return;
    await navigator.clipboard.writeText(
      `To: ${item.customer.email ?? ""}\nSubject: ${item.draftSubject}\n\n${item.draftBody}`,
    );
    setCopiedId(item.caseId);
  }

  return (
    <section className="surface-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Checkout drop-offs</p>
          <h2>Prepare a recovery email</h2>
          <p>
            No email is sent by RecoveryOS. Select an unpaid checkout to create
            an auditable, copyable draft; connect a provider later to deliver
            it.
          </p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Checkout</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Draft status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.caseId}>
                <td>
                  <strong>{item.caseId}</strong>
                  <br />
                  <span className="subtle-id">{item.orderId}</span>
                </td>
                <td>
                  {item.customer.name}
                  <br />
                  <span className="subtle-id">
                    {item.customer.email ?? "No eligible email"}
                  </span>
                </td>
                <td>{formatMoney(item.amountPaise, item.currency)}</td>
                <td>
                  <strong>{item.status.replaceAll("_", " ")}</strong>
                  <br />
                  <span className="subtle-id">
                    {item.policyReason ?? "Awaiting merchant selection"}
                  </span>
                </td>
                <td>
                  {item.status === "OPEN" ? (
                    <button
                      className="secondary-action"
                      disabled={busyId === item.caseId}
                      onClick={() => void createDraft(item)}
                      type="button"
                    >
                      {busyId === item.caseId ? "Preparing…" : "Prepare email"}
                    </button>
                  ) : item.draftBody ? (
                    <>
                      <button
                        className="secondary-action"
                        onClick={() => void copyDraft(item)}
                        type="button"
                      >
                        {copiedId === item.caseId ? "Copied" : "Copy email"}
                      </button>
                      <details>
                        <summary>Preview draft</summary>
                        <pre>{item.draftBody}</pre>
                      </details>
                    </>
                  ) : (
                    <span className="subtle-id">Policy stopped</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
