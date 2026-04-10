/**
 * DailyActivityChart — Area chart showing activities per day over last 30 days.
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export function DailyActivityChart({ data = [] }) {
  return (
    <div className="chart-card">
      <div className="chart-title">Daily Activity Volume (Last 30 Days)</div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="total"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorTotal)"
            name="Total"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="high"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorHigh)"
            name="High Risk"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
