export default function RecoveriesLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading reported issues"
      className="page-stack"
    >
      <div className="skeleton surface" style={{ minHeight: "7rem" }} />
      <div className="skeleton surface" style={{ minHeight: "5.5rem" }} />
      <div className="skeleton surface" style={{ minHeight: "23rem" }} />
    </div>
  );
}
