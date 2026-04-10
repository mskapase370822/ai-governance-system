import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

/**
 * Risk Trend Chart — 30-day trend with HIGH/MEDIUM/LOW lines.
 * Expects data: [{ date: "Jan 01", HIGH: 3, MEDIUM: 5, LOW: 12 }, ...]
 */
export default function RiskTrendChart({ data = [] }) {
  return (
    <div className="chart-container">
      <div className="card-title" style={{ marginBottom: 16 }}>Risk Trend (30 days)</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "#1a2236",
              border: "1px solid rgba(148,163,184,0.12)",
              borderRadius: 10,
              color: "#f1f5f9",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="HIGH" stroke="#dc2626" strokeWidth={2} dot={false} name="High Risk" />
          <Line type="monotone" dataKey="MEDIUM" stroke="#d97706" strokeWidth={2} dot={false} name="Medium Risk" />
          <Line type="monotone" dataKey="LOW" stroke="#16a34a" strokeWidth={2} dot={false} name="Low Risk" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
