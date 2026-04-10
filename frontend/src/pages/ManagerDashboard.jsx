import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { StatsCard } from "../components/StatsCard";
import { LogTable } from "../components/LogTable";
import { PromptForm } from "../components/PromptForm";
import {
  FileText, ShieldAlert, Users, Activity, AlertTriangle,
  BarChart3, Send, Bell, Zap,
} from "lucide-react";
import {
  getDashboardStatsAPI, getAllLogsAPI, getAlertsAPI,
} from "../services/api";
import { initializeSocket, disconnectSocket } from "../services/websocket";
import { AlertToast } from "../components/AlertToast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState("all");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRisk !== "all") params.riskLevel = filterRisk;
      const [statsRes, logsRes, alertsRes] = await Promise.all([
        getDashboardStatsAPI(),
        getAllLogsAPI(params),
        getAlertsAPI({ limit: 30 }),
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data.logs || logsRes.data);
      setAlertHistory(alertsRes.data.alerts || alertsRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [filterRisk]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket for real-time alerts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = initializeSocket(token);
    socket.on("risk_alert", (data) => {
      setToasts((prev) => [...prev, { ...data, id: Date.now() }]);
      fetchData();
    });
    return () => disconnectSocket();
  }, [fetchData]);

  const dismissToast = (id) => setToasts((prev) => prev.filter((a) => a.id !== id));

  const s = stats?.summary || {};
  const riskChartData = stats?.riskDistribution || [];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="alert-container">
        {toasts.map((alert) => (
          <AlertToast key={alert.id} alert={alert} onDismiss={() => dismissToast(alert.id)} />
        ))}
      </div>

      <div className="page-content">
        <div className="dashboard-welcome">
          <h1>Manager <span className="text-gradient">Dashboard</span></h1>
          <p>Monitor team activity and review risk reports.</p>
        </div>

        {/* Stats */}
        <div className="grid-stats">
          <StatsCard title="Total Logs" value={s.totalLogs || 0} icon={FileText} color="blue" />
          <StatsCard title="High Risk" value={s.highRisk || 0} icon={ShieldAlert} color="red" />
          <StatsCard title="Anomalies" value={s.anomalies || 0} icon={Zap} color="yellow" />
          <StatsCard title="Users" value={s.activeUsers || 0} icon={Users} color="violet" />
        </div>

        <div className="grid-2col" style={{ marginBottom: 24 }}>
          {/* Submit action */}
          <div className="card">
            <div className="card-title"><Send size={18} /> Submit an Action</div>
            <PromptForm onLogCreated={() => fetchData()} />
          </div>

          {/* Risk chart */}
          <div className="chart-container">
            <div className="card-title" style={{ marginBottom: 20 }}>
              <BarChart3 size={18} /> Risk Distribution
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskChartData} barSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "10px", color: "#f1f5f9" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        {alertHistory.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title"><Bell size={18} /> Recent Alerts</div>
            <div className="alert-panel" style={{ maxHeight: 250 }}>
              {alertHistory.slice(0, 10).map((alert, i) => (
                <div key={alert._id || i} className="alert-panel-item">
                  <div className="alert-dot" />
                  <div className="alert-text">
                    <strong>{alert.username || alert.user || "Unknown"}</strong> — {alert.riskLevel} risk
                    {alert.reason && <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 2 }}>{alert.reason}</div>}
                    <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "Just now"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="card-header" style={{ padding: "20px 24px", marginBottom: 0, borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="card-title"><FileText size={18} /> All Activity Logs</div>
            <button className="btn btn-ghost btn-sm" onClick={fetchData}>Refresh</button>
          </div>
          <div className="filter-bar" style={{ padding: "16px 24px 0" }}>
            <select className="select" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ minWidth: 150, width: "auto" }}>
              <option value="all">All Risk Levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}><div className="spinner spinner-lg"></div></div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              <LogTable logs={Array.isArray(logs) ? logs : []} isAdmin={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
