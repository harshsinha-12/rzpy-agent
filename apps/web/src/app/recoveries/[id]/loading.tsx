export default function RecoveryDetailLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading recovery detail"
      className="page-stack"
    >
      <div className="skeleton surface" style={{ minHeight: "13rem" }} />
      <div className="skeleton surface" style={{ minHeight: "8rem" }} />
      <div className="skeleton surface" style={{ minHeight: "24rem" }} />
    </div>
  );
}
