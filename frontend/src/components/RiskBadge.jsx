export function RiskBadge({ level }) {
  const normalize = (l) => {
    if (typeof l === "number") {
      if (l < 0.4) return "low";
      if (l < 0.7) return "medium";
      return "high";
    }
    const str = String(l).toLowerCase();
    if (str === "safe" || str === "low") return "low";
    if (str === "medium") return "medium";
    return "high";
  };

  const riskKey = normalize(level);

  const labels = {
    low: "Low Risk",
    medium: "Med Risk",
    high: "High Risk",
  };

  return (
    <span className={`badge badge-${riskKey}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "currentColor",
          display: "inline-block",
        }}
      />
      {labels[riskKey]}
    </span>
  );
}