/**
 * RiskDistributionChart — Pie chart showing HIGH/MEDIUM/LOW distribution with percentages.
 */
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function RiskDistributionChart({ stats = {} }) {
  const data = [
    { name: "High Risk", value: stats.highRisk || 0, key: "HIGH" },
    { name: "Medium Risk", value: stats.mediumRisk || 0, key: "MEDIUM" },
    { name: "Low Risk", value: stats.lowRisk || 0, key: "LOW" },
  ].filter((d) => d.value > 0);

  if (!data.length) {
    return (
      <div className="chart-card">
        <div className="chart-title">Risk Distribution</div>
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted, #9ca3af)" }}>No data yet</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-title">Risk Distribution</div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, name]}
            contentStyle={{
              background: "var(--card-bg, #1e2433)",
              border: "1px solid var(--border-subtle, #334155)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
