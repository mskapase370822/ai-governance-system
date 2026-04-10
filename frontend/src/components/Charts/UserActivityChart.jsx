import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from "recharts";

/**
 * User Activity Chart — Bar chart of top users by activity count.
 * Expects data: [{ username: "alice", count: 42, highRisk: 5 }, ...]
 */
export default function UserActivityChart({ data = [] }) {
  const getBarColor = (entry) => {
    if (entry.highRisk > 0) return "#dc2626";
    if (entry.mediumRisk > 0) return "#d97706";
    return "#2563eb";
  };

  return (
    <div className="chart-container">
      <div className="card-title" style={{ marginBottom: 16 }}>Top Users by Activity</div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data.slice(0, 10)}
          barSize={28}
          margin={{ top: 4, right: 16, left: -10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
          <XAxis
            dataKey="username"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            angle={-30}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2236",
              border: "1px solid rgba(148,163,184,0.12)",
              borderRadius: 10,
              color: "#f1f5f9",
            }}
            formatter={(value, name, props) => [
              `${value} total (${props.payload.highRisk || 0} high risk)`,
              "Activities",
            ]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.slice(0, 10).map((entry, i) => (
              <Cell key={i} fill={getBarColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
