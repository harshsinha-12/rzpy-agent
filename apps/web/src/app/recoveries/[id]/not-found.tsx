import Link from "next/link";

export default function RecoveryCaseNotFound() {
  return (
    <section className="surface" style={{ padding: "2rem" }}>
      <p className="eyebrow">Recovery case not found</p>
      <h1 className="page-title">This case is not in the ledger.</h1>
      <p className="page-description">
        The identifier may be wrong, or the case may no longer be available.
      </p>
      <Link className="error-action" href="/recoveries">
        Return to reported issues
      </Link>
    </section>
  );
}
