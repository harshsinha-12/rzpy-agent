"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <section className="surface" style={{ padding: "2rem" }}>
      <p className="eyebrow">Dashboard unavailable</p>
      <h1 className="page-title">We couldn&apos;t load recovery data.</h1>
      <p className="page-description">
        Check that the RecoveryOS API is running, then try this request again.
      </p>
      <button className="error-action" onClick={reset} type="button">
        Try again
      </button>
    </section>
  );
}
