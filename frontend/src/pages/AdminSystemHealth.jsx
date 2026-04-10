import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { Activity, Cpu, Clock, TrendingUp, RefreshCw, Zap, AlertTriangle } from "lucide-react";
import { getSystemMetricsAPI, getMLStatsAPI, trainMLModelAPI } from "../services/api";

export default function AdminSystemHealth() {
  const [metrics,     setMetrics]     = useState(null);
  const [mlStats,     setMlStats]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [mlTraining,  setMlTraining]  = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [error,       setError]       = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [metricsRes, mlRes] = await Promise.all([
        getSystemMetricsAPI(),
        getMLStatsAPI(),
      ]);
      setMetrics(metricsRes.data);
      setMlStats(mlRes.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const handleTrainML = async () => {
    setMlTraining(true);
    setTrainResult(null);
    try {
      const res = await trainMLModelAPI({ iterations: 500 });
      setTrainResult(res.data);
      setMlStats(res.data.stats);
    } catch (err) {
      setTrainResult({ error: err.response?.data?.error || err.message });
    } finally {
      setMlTraining(false);
    }
  };

  const health = metrics?.health || {};
  const api    = metrics?.api    || {};
  const sla    = metrics?.sla    || {};

  const slaGood  = sla.status === "GOOD";
  const slaColor = slaGood ? "#16a34a" : "#d97706";

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div className="dashboard-welcome">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1>System <span className="text-gradient">Health</span></h1>
              <p>Real-time performance metrics and infrastructure status.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchAll} disabled={loading}>
              <RefreshCw size={15} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
              &nbsp;Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(220,38,38,0.1)", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {loading && !metrics ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* SLA banner */}
            <div className="card" style={{ padding: 24, borderLeft: `3px solid ${slaColor}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={18} style={{ color: slaColor }} />
                  SLA Compliance
                </div>
                <span style={{
                  padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  background: slaGood ? "rgba(22,163,74,0.15)" : "rgba(217,119,6,0.15)",
                  color: slaColor,
                }}>
                  {sla.status || "—"}
                </span>
              </div>
              <div style={{ height: 8, background: "var(--border-subtle)", borderRadius: 4, marginBottom: 10 }}>
                <div style={{ height: 8, background: slaColor, borderRadius: 4, width: `${Math.min(100, sla.compliance || 0)}%`, transition: "width 0.6s" }} />
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
                <span>Compliance: <strong style={{ color: slaColor }}>{sla.compliance ?? "—"}%</strong></span>
                <span>Target: <strong>{sla.complianceTarget ?? "—"}%</strong></span>
                <span>Avg response: <strong>{sla.avgResponseTimeMs ?? "—"} ms</strong></span>
                <span>Target: <strong>{sla.targetMs ?? "—"} ms</strong></span>
              </div>
            </div>

            {/* API metrics */}
            <div className="grid-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <MetricCard icon={<Activity size={20} />}     label="Total Requests"     value={api.totalRequests ?? "—"}                                       color="blue"   />
              <MetricCard icon={<Zap size={20} />}          label="Avg Response Time"  value={api.avgResponseTime != null ? `${api.avgResponseTime} ms` : "—"} color="green"  />
              <MetricCard icon={<AlertTriangle size={20} />} label="Error Rate"         value={api.errorRate != null ? `${api.errorRate}%` : "—"}               color={api.errorRate > 5 ? "red" : "green"} />
              <MetricCard icon={<Clock size={20} />}        label="Uptime"             value={health.uptimeFormatted || "—"}                                   color="blue"   />
            </div>

            {/* Memory */}
            <div className="card" style={{ padding: 24 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>
                <Cpu size={18} />
                Memory Usage
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
                {[
                  { label: "Heap Used",  value: health.memory?.heapUsed  },
                  { label: "Heap Total", value: health.memory?.heapTotal },
                  { label: "RSS",        value: health.memory?.rss       },
                  { label: "External",   value: health.memory?.external  },
                ].map((m) => (
                  <div key={m.label} style={{
                    textAlign: "center", padding: 16,
                    background: "var(--bg-card)", borderRadius: 10,
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>
                      {m.value ?? "—"}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}> MB</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* System info */}
            <div className="card" style={{ padding: 24 }}>
              <div className="card-title" style={{ marginBottom: 20 }}>
                <Cpu size={18} />
                System Info
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { label: "Node.js Version", value: health.nodeVersion },
                  { label: "Platform",        value: health.platform    },
                  { label: "Last Refreshed",  value: health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "—" },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontWeight: 600 }}>{item.value || "—"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ML model */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div className="card-title" style={{ margin: 0 }}>
                  🤖 ML Risk Model
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleTrainML} disabled={mlTraining}>
                  {mlTraining
                    ? <><RefreshCw size={13} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />Training…</>
                    : "Re-train Model"}
                </button>
              </div>
              {mlStats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
                  {[
                    { label: "Status",       value: mlStats.trained ? "✅ Trained" : "⚠️ Untrained" },
                    { label: "Architecture", value: mlStats.architecture },
                    { label: "Activation",   value: mlStats.activation   },
                    { label: "Parameters",   value: mlStats.parameters?.toLocaleString() },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontWeight: 600 }}>{item.value || "—"}</div>
                    </div>
                  ))}
                </div>
              )}
              {trainResult && (
                <div style={{
                  marginTop: 16, padding: "12px 16px", borderRadius: 8, fontSize: 13,
                  background: trainResult.error ? "rgba(220,38,38,0.1)" : "rgba(22,163,74,0.1)",
                  color: trainResult.error ? "#dc2626" : "#16a34a",
                }}>
                  {trainResult.error
                    ? `❌ Training failed: ${trainResult.error}`
                    : `✅ Training complete — iterations: ${trainResult.iterations}, final error: ${trainResult.finalError?.toFixed(5)}`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color = "blue" }) {
  const colorMap = {
    blue:   { bg: "rgba(37,99,235,0.08)",  text: "#2563eb" },
    green:  { bg: "rgba(22,163,74,0.08)",  text: "#16a34a" },
    red:    { bg: "rgba(220,38,38,0.08)",  text: "#dc2626" },
    yellow: { bg: "rgba(217,119,6,0.08)", text: "#d97706" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: c.bg, color: c.text,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
