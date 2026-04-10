import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = { HIGH: "#dc2626", MEDIUM: "#d97706", LOW: "#16a34a" };

/**
 * Risk Distribution Chart — Pie chart with HIGH/MEDIUM/LOW percentages.
 * Expects data: [{ name: "HIGH", value: 12 }, ...]
 */
export default function RiskDistributionChart({ data = [], onFilter }) {
  const [active, setActive] = useState(null);

  const total = data.reduce((s, d) => s + d.value, 0);

  const handleClick = (entry) => {
    if (onFilter) onFilter(entry.name);
    setActive(active === entry.name ? null : entry.name);
  };

  return (
    <div className="chart-container">
      <div className="card-title" style={{ marginBottom: 16 }}>Risk Distribution</div>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            onClick={(entry) => handleClick(entry)}
            style={{ cursor: onFilter ? "pointer" : "default" }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name] || "#6b7280"}
                opacity={active && active !== entry.name ? 0.4 : 1}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#1a2236",
              border: "1px solid rgba(148,163,184,0.12)",
              borderRadius: 10,
              color: "#f1f5f9",
            }}
            formatter={(value) => [
              `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
              "Count",
            ]}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
