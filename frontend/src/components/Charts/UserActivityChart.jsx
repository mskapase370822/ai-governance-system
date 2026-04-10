/**
 * UserActivityChart — Bar chart showing top 10 users by activity count.
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div
        style={{
          background: "var(--card-bg, #1e2433)",
          border: "1px solid var(--border-subtle, #334155)",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 12,
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, color: "var(--text-primary, #f1f5f9)" }}>{d.username}</p>
        <p style={{ margin: "4px 0 0", color: "#6366f1" }}>Activities: {d.count}</p>
        {d.highRisk > 0 && <p style={{ margin: "2px 0 0", color: "#ef4444" }}>High Risk: {d.highRisk}</p>}
      </div>
    );
  }
  return null;
};

export function UserActivityChart({ data = [] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="chart-card">
      <div className="chart-title">Top 10 Users by Activity</div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted, #9ca3af)" }}>No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sorted} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #e5e7eb)" />
            <XAxis
              dataKey="username"
              tick={{ fontSize: 10, fill: "var(--text-muted, #9ca3af)" }}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted, #9ca3af)" }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Activities" radius={[4, 4, 0, 0]}>
              {sorted.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.highRisk > 0 ? "#ef4444" : "#6366f1"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
