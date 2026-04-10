/**
 * RiskTrendChart — Line chart showing HIGH/MEDIUM/LOW risk counts over last 30 days.
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export function RiskTrendChart({ data = [] }) {
  return (
    <div className="chart-card">
      <div className="chart-title">Risk Trend (Last 30 Days)</div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #e5e7eb)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--text-muted, #9ca3af)" }}
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }}
          />
          <YAxis tick={{ fontSize: 11, fill: "var(--text-muted, #9ca3af)" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "var(--card-bg, #1e2433)",
              border: "1px solid var(--border-subtle, #334155)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="HIGH" stroke="#ef4444" strokeWidth={2} dot={false} name="High Risk" />
          <Line type="monotone" dataKey="MEDIUM" stroke="#f59e0b" strokeWidth={2} dot={false} name="Medium Risk" />
          <Line type="monotone" dataKey="LOW" stroke="#22c55e" strokeWidth={2} dot={false} name="Low Risk" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
