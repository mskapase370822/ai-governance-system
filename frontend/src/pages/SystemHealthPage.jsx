import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { Activity, Server, Clock, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  getSystemMetricsAPI,
  getAPIMetricsAPI,
  getSLAMetricsAPI,
  getPerformanceHealthAPI,
} from "../services/api";

const STATUS_COLORS = { healthy: "#22c55e", warning: "#f59e0b", critical: "#ef4444" };
const STATUS_LABELS = { healthy: "Healthy", warning: "Warning", critical: "Critical" };

function StatusDot({ status }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: STATUS_COLORS[status] || "#9ca3af",
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  );
}

function MetricRow({ label, value, unit = "", status }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid var(--border-subtle, #e5e7eb)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", color: "var(--text-secondary, #6b7280)", fontSize: 14 }}>
        {status && <StatusDot status={status} />}
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, color: STATUS_COLORS[status] || "var(--text-primary)" }}>
        {value}{unit}
      </div>
    </div>
  );
}

const REFRESH_INTERVAL = 15_000; // 15 seconds

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [system, setSystem] = useState(null);
  const [api, setApi] = useState(null);
  const [sla, setSla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [responseHistory, setResponseHistory] = useState([]);

  const fetchAll = useCallback(async () => {
    try {
      const [healthRes, sysRes, apiRes, slaRes] = await Promise.all([
        getPerformanceHealthAPI(),
        getSystemMetricsAPI(),
        getAPIMetricsAPI(),
        getSLAMetricsAPI(),
      ]);
      setHealth(healthRes.data);
      setSystem(sysRes.data);
      setApi(apiRes.data);
      setSla(slaRes.data);
      setLastUpdated(new Date());

      // Keep rolling response time history (last 20 data points)
      setResponseHistory((prev) => {
        const entry = {
          time: new Date().toLocaleTimeString(),
          avg: apiRes.data.avgResponseMs || 0,
          slaTarget: slaRes.data.slaTargetMs || 500,
        };
        return [...prev.slice(-19), entry];
      });
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const overallStatus = health?.overall || "healthy";

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="dashboard-welcome">
          <h1>System <span className="text-gradient">Health</span></h1>
          <p>Real-time performance metrics and SLA tracking.</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <>
            {/* Overall status banner */}
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 24px",
                borderLeft: `4px solid ${STATUS_COLORS[overallStatus]}`,
                marginBottom: 0,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: STATUS_COLORS[overallStatus],
                  boxShadow: `0 0 0 4px ${STATUS_COLORS[overallStatus]}33`,
                  animation: overallStatus !== "healthy" ? "pulse 1.5s infinite" : "none",
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: STATUS_COLORS[overallStatus] }}>
                  System {STATUS_LABELS[overallStatus]}
                </div>
                {lastUpdated && (
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={fetchAll}
                style={{ marginLeft: "auto" }}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {/* Metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {/* API metrics */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 4 }}>
                  <Activity size={16} /> API Performance
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 16 }}>
                  Rolling 1-minute window
                </div>
                <MetricRow
                  label="Avg Response Time"
                  value={api?.avgResponseMs ?? 0}
                  unit="ms"
                  status={api?.avgResponseMs > 1000 ? "critical" : api?.avgResponseMs > 500 ? "warning" : "healthy"}
                />
                <MetricRow label="Min Response Time" value={api?.minResponseMs ?? 0} unit="ms" />
                <MetricRow label="Max Response Time" value={api?.maxResponseMs ?? 0} unit="ms" />
                <MetricRow
                  label="Requests / Min"
                  value={api?.requestsPerMinute ?? 0}
                />
                <MetricRow
                  label="Error Rate"
                  value={`${api?.errorRatePercent ?? 0}`}
                  unit="%"
                  status={api?.errorRatePercent > 10 ? "critical" : api?.errorRatePercent > 5 ? "warning" : "healthy"}
                />
              </div>

              {/* System metrics */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 4 }}>
                  <Server size={16} /> System Resources
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 16 }}>
                  {system?.platform} — Node {system?.nodeVersion}
                </div>
                <MetricRow
                  label="Memory Usage"
                  value={`${system?.memory?.usedMB ?? 0} / ${system?.memory?.totalMB ?? 0}`}
                  unit=" MB"
                  status={
                    system?.memory?.usagePercent > 90 ? "critical" :
                    system?.memory?.usagePercent > 75 ? "warning" : "healthy"
                  }
                />
                <MetricRow label="Memory %" value={system?.memory?.usagePercent ?? 0} unit="%" />
                <MetricRow label="Free Memory" value={system?.memory?.freeMB ?? 0} unit=" MB" />
                <MetricRow label="CPU Cores" value={system?.cpu?.cores ?? 0} />
                <MetricRow
                  label="Uptime"
                  value={`${system?.uptime?.hours ?? 0}`}
                  unit="h"
                />
              </div>

              {/* SLA metrics */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 4 }}>
                  <TrendingUp size={16} /> SLA Compliance
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 16 }}>
                  Target: {sla?.slaTargetPercent ?? 99.5}% within {sla?.slaTargetMs ?? 500}ms
                </div>

                {/* Compliance progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Compliance</span>
                    <span style={{ fontWeight: 700, color: STATUS_COLORS[sla?.status || "healthy"] }}>
                      {sla?.slaCompliancePercent ?? 100}%
                    </span>
                  </div>
                  <div style={{ background: "var(--border-subtle, #e5e7eb)", borderRadius: 999, height: 8 }}>
                    <div
                      style={{
                        background: STATUS_COLORS[sla?.status || "healthy"],
                        width: `${Math.min(sla?.slaCompliancePercent ?? 100, 100)}%`,
                        height: "100%",
                        borderRadius: 999,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>

                <MetricRow label="SLA Target" value={`${sla?.slaTargetPercent ?? 99.5}`} unit="%" />
                <MetricRow label="Response Target" value={sla?.slaTargetMs ?? 500} unit="ms" />
                <MetricRow
                  label="Status"
                  value={STATUS_LABELS[sla?.status || "healthy"]}
                  status={sla?.status || "healthy"}
                />

                {/* Component health */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Component Status
                  </div>
                  {Object.entries(health?.components || {}).map(([key, status]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 4 }}>
                      <StatusDot status={status} />
                      <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{key}</span>
                      <span style={{ marginLeft: "auto", fontSize: 12, color: STATUS_COLORS[status] }}>
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Response time chart */}
            {responseHistory.length > 1 && (
              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>
                  <Clock size={16} /> Response Time History
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={responseHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #e5e7eb)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--text-muted, #9ca3af)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted, #9ca3af)" }} unit="ms" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card-bg, #1e2433)",
                        border: "1px solid var(--border-subtle, #334155)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      name="Avg Response (ms)"
                    />
                    <Line
                      type="monotone"
                      dataKey="slaTarget"
                      stroke="#ef4444"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      dot={false}
                      name="SLA Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
