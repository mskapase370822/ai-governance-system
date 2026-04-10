import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";

/**
 * Daily Activity Chart — Stacked area chart per day.
 * Expects data: [{ date: "Jan 01", HIGH: 2, MEDIUM: 4, LOW: 9 }, ...]
 */
export default function DailyActivityChart({ data = [] }) {
  const [filter, setFilter] = useState("all");

  const showHigh = filter === "all" || filter === "HIGH";
  const showMedium = filter === "all" || filter === "MEDIUM";
  const showLow = filter === "all" || filter === "LOW";

  return (
    <div className="chart-container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="card-title" style={{ margin: 0 }}>Daily Activities (30 days)</div>
        <select
          className="select"
          style={{ width: "auto", minWidth: 130, fontSize: 12, padding: "4px 8px" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Levels</option>
          <option value="HIGH">High Only</option>
          <option value="MEDIUM">Medium Only</option>
          <option value="LOW">Low Only</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
          <defs>
            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          {showHigh && (
            <Area
              type="monotone"
              dataKey="HIGH"
              stroke="#dc2626"
              fill="url(#colorHigh)"
              strokeWidth={2}
              name="High Risk"
            />
          )}
          {showMedium && (
            <Area
              type="monotone"
              dataKey="MEDIUM"
              stroke="#d97706"
              fill="url(#colorMed)"
              strokeWidth={2}
              name="Medium Risk"
            />
          )}
          {showLow && (
            <Area
              type="monotone"
              dataKey="LOW"
              stroke="#16a34a"
              fill="url(#colorLow)"
              strokeWidth={2}
              name="Low Risk"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
