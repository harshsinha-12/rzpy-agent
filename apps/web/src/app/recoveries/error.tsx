"use client";

export default function RecoveriesError({ reset }: { reset: () => void }) {
  return (
    <section className="surface" style={{ padding: "2rem" }}>
      <p className="eyebrow">Reported issues unavailable</p>
      <h1 className="page-title">We couldn&apos;t load recovery cases.</h1>
      <p className="page-description">
        The filters are safe, but the API did not return case data. Try the
        request again.
      </p>
      <button className="error-action" onClick={reset} type="button">
        Try again
      </button>
    </section>
  );
}
