export default function DashboardLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading recovery dashboard"
      className="page-stack"
    >
      <div className="skeleton surface" style={{ minHeight: "7rem" }} />
      <div
        style={{
          display: "grid",
          gap: "0.9rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))",
        }}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton surface" key={index} />
        ))}
      </div>
      <div className="skeleton surface" style={{ minHeight: "18rem" }} />
    </div>
  );
}
