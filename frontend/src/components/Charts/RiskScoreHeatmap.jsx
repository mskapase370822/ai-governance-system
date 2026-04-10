/**
 * Risk Score Heatmap — calendar-style heat map (last 30 days).
 * Expects data: [{ date: "2024-01-15", count: 5, highRisk: 2 }, ...]
 */
export default function RiskScoreHeatmap({ data = [] }) {
  const getColor = (count, highRisk) => {
    if (count === 0) return "#1e293b";
    if (highRisk >= 3) return "#991b1b";
    if (highRisk >= 1) return "#dc2626";
    if (count >= 10) return "#1d4ed8";
    if (count >= 5) return "#2563eb";
    return "#3b82f6";
  };

  const getIntensity = (count) => {
    if (count === 0) return "No activity";
    if (count === 1) return "1 activity";
    return `${count} activities`;
  };

  return (
    <div className="chart-container">
      <div className="card-title" style={{ marginBottom: 16 }}>Activity Heatmap (30 days)</div>
      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: 4,
            minWidth: 300,
          }}
        >
          {data.map((day, i) => (
            <div key={i} style={{ position: "relative" }} title={`${day.date}: ${getIntensity(day.count)}${day.highRisk > 0 ? `, ${day.highRisk} high risk` : ""}`}>
              <div
                style={{
                  width: "100%",
                  paddingBottom: "100%",
                  background: getColor(day.count, day.highRisk),
                  borderRadius: 3,
                  cursor: "default",
                  transition: "opacity 0.2s",
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 11, color: "#64748b" }}>
        <span>Less</span>
        {["#1e293b", "#3b82f6", "#2563eb", "#dc2626", "#991b1b"].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, background: c, borderRadius: 2 }} />
        ))}
        <span>More / High Risk</span>
      </div>
    </div>
  );
}
