import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { StatsCard } from "../components/StatsCard";
import { LogTable } from "../components/LogTable";
import { AlertToast } from "../components/AlertToast";
import { ApprovalPanel } from "../components/ApprovalPanel";
import { PolicyManager } from "../components/PolicyManager";
import {
  FileText, ShieldAlert, Users, Activity, AlertTriangle,
  BarChart3, Bell, CheckCircle, Clock, Shield, XCircle, Zap,
} from "lucide-react";
import {
  getDashboardStatsAPI, getAllLogsAPI, getPendingApprovalsAPI,
  getPoliciesAPI, getAlertsAPI,
} from "../services/api";
import { initializeSocket, disconnectSocket } from "../services/websocket";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend,
} from "recharts";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "logs", label: "Audit Logs", icon: FileText },
  { id: "approvals", label: "Approvals", icon: CheckCircle },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "policies", label: "Policies", icon: Shield },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getDashboardStatsAPI();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRisk !== "all") params.riskLevel = filterRisk;
      if (filterStatus !== "all") params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;
      const res = await getAllLogsAPI(params);
      setLogs(res.data.logs || res.data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, [filterRisk, filterStatus, searchQuery]);

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await getPendingApprovalsAPI();
      setApprovals(res.data);
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await getPoliciesAPI();
      setPolicies(res.data);
    } catch (err) {
      console.error("Failed to fetch policies:", err);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await getAlertsAPI({ limit: 50 });
      setAlertHistory(res.data.alerts || res.data);
      setUnreadAlerts(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchLogs();
    fetchApprovals();
    fetchPolicies();
    fetchAlerts();
  }, [fetchStats, fetchLogs, fetchApprovals, fetchPolicies, fetchAlerts]);

  // WebSocket for real-time alerts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = initializeSocket(token);

    socket.on("risk_alert", (data) => {
      const alertData = { ...data, id: Date.now() };
      setToasts((prev) => [...prev, alertData]);
      setAlertHistory((prev) => [alertData, ...prev].slice(0, 50));
      setUnreadAlerts((prev) => prev + 1);
      fetchStats();
    });

    socket.on("approval_request", () => {
      fetchApprovals();
    });

    socket.on("approval_updated", () => {
      fetchApprovals();
      fetchLogs();
    });

    return () => disconnectSocket();
  }, [fetchStats, fetchApprovals, fetchLogs]);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((a) => a.id !== id));
  };

  // Chart data
  const riskChartData = stats?.riskDistribution || [
    { name: "Low", count: 0, color: "#10b981" },
    { name: "Medium", count: 0, color: "#f59e0b" },
    { name: "High", count: 0, color: "#ef4444" },
  ];

  const statusChartData = (stats?.statusCounts || []).map((s) => ({
    name: s._id || "unknown",
    value: s.count,
    color: s._id === "allowed" ? "#10b981" : s._id === "blocked" ? "#ef4444" :
           s._id === "warned" ? "#f59e0b" : s._id === "pending_approval" ? "#8b5cf6" : "#64748b",
  }));

  const dailyData = (stats?.dailyActivity || []).map((d) => ({
    date: d._id?.slice(5) || "",
    total: d.total,
    high: d.high,
    medium: d.medium,
    low: d.low,
  }));

  const s = stats?.summary || {};

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Floating alert toasts */}
      <div className="alert-container">
        {toasts.map((alert) => (
          <AlertToast key={alert.id} alert={alert} onDismiss={() => dismissToast(alert.id)} />
        ))}
      </div>

      <div className="page-content">
        {/* Welcome */}
        <div className="dashboard-welcome">
          <h1>Admin <span className="text-gradient">Control Panel</span></h1>
          <p>Monitor all activity, manage approvals, and enforce governance policies.</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
                {tab.id === "approvals" && approvals.length > 0 && (
                  <span className="tab-badge">{approvals.length}</span>
                )}
                {tab.id === "alerts" && unreadAlerts > 0 && (
                  <span className="tab-badge">{unreadAlerts}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* === OVERVIEW TAB === */}
        {activeTab === "overview" && (
          <>
            {/* Stats Grid */}
            <div className="grid-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <StatsCard title="Total Logs" value={s.totalLogs || 0} icon={FileText} color="blue" />
              <StatsCard title="High Risk" value={s.highRisk || 0} icon={ShieldAlert} color="red" />
              <StatsCard title="Blocked" value={s.blocked || 0} icon={XCircle} color="red" />
              <StatsCard title="Pending" value={s.pendingApprovals || 0} icon={Clock} color="violet" />
              <StatsCard title="Anomalies" value={s.anomalies || 0} icon={Zap} color="yellow" />
              <StatsCard title="Users" value={s.activeUsers || 0} icon={Users} color="blue" />
            </div>

            {/* Charts Row */}
            <div className="grid-2col" style={{ marginBottom: 24 }}>
              {/* Risk Distribution */}
              <div className="chart-container">
                <div className="card-title" style={{ marginBottom: 20 }}>
                  <BarChart3 size={18} />
                  Risk Distribution
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={riskChartData} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.12)" }} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.12)" }} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "10px", color: "#f1f5f9", fontSize: "0.85rem" }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {riskChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Action Status Pie */}
              <div className="chart-container">
                <div className="card-title" style={{ marginBottom: 20 }}>
                  <Activity size={18} />
                  Action Outcomes
                </div>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {statusChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "10px", color: "#f1f5f9" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="approval-empty"><p>No data yet</p></div>
                )}
              </div>
            </div>

            {/* Activity Trend */}
            {dailyData.length > 0 && (
              <div className="chart-container" style={{ marginBottom: 24 }}>
                <div className="card-title" style={{ marginBottom: 20 }}>
                  <Activity size={18} />
                  7-Day Activity Trend
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid rgba(148,163,184,0.12)", borderRadius: "10px", color: "#f1f5f9" }} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" dot={false} />
                    <Line type="monotone" dataKey="high" stroke="#ef4444" strokeWidth={2} name="High Risk" dot={false} />
                    <Line type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={2} name="Medium" dot={false} />
                    <Line type="monotone" dataKey="low" stroke="#10b981" strokeWidth={2} name="Low" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top risky users */}
            {stats?.topRiskyUsers?.length > 0 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-title" style={{ marginBottom: 16 }}>
                  <AlertTriangle size={18} />
                  Top Risky Users
                </div>
                <div className="risky-users-list">
                  {stats.topRiskyUsers.map((u, i) => (
                    <div key={i} className="risky-user-item">
                      <div className="risky-user-rank">#{i + 1}</div>
                      <div className="avatar avatar-xs">
                        {u.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="risky-user-info">
                        <span className="risky-user-name">{u.username}</span>
                        <span className="badge badge-role">{u.role}</span>
                      </div>
                      <div className="risky-user-count">{u.highRiskCount} flagged</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* === LOGS TAB === */}
        {activeTab === "logs" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="card-header" style={{ padding: "20px 24px", marginBottom: 0, borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="card-title">
                <FileText size={18} />
                Audit Trail — All Activity Logs
              </div>
              <button className="btn btn-ghost btn-sm" onClick={fetchLogs}>Refresh</button>
            </div>

            <div className="filter-bar" style={{ padding: "16px 24px 0" }}>
              <select className="select" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ minWidth: 150, width: "auto" }}>
                <option value="all">All Risk Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>
              <select className="select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ minWidth: 150, width: "auto" }}>
                <option value="all">All Statuses</option>
                <option value="allowed">Allowed</option>
                <option value="warned">Warned</option>
                <option value="blocked">Blocked</option>
                <option value="pending_approval">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
              <input
                className="input"
                placeholder="Search user, input, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ maxWidth: 280 }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                {Array.isArray(logs) ? logs.length : 0} logs
              </span>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                <div className="spinner spinner-lg"></div>
              </div>
            ) : (
              <div style={{ maxHeight: 600, overflowY: "auto" }}>
                <LogTable logs={Array.isArray(logs) ? logs : []} isAdmin={true} />
              </div>
            )}
          </div>
        )}

        {/* === APPROVALS TAB === */}
        {activeTab === "approvals" && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              <CheckCircle size={18} />
              Pending Approval Requests
              {approvals.length > 0 && <span className="tab-badge" style={{ marginLeft: 8 }}>{approvals.length}</span>}
            </div>
            <ApprovalPanel
              approvals={approvals}
              onUpdate={() => {
                fetchApprovals();
                fetchLogs();
                fetchStats();
              }}
            />
          </div>
        )}

        {/* === ALERTS TAB === */}
        {activeTab === "alerts" && (
          <div className="card">
            <div className="card-header" style={{ marginBottom: 0 }}>
              <div className="card-title">
                <Bell size={18} />
                Alert History
              </div>
              <button className="btn btn-ghost btn-sm" onClick={fetchAlerts}>Refresh</button>
            </div>
            <div className="alert-panel" style={{ maxHeight: 600 }}>
              {alertHistory.length === 0 ? (
                <div className="alert-panel-empty">
                  <ShieldAlert size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>No alerts yet. Monitoring in real-time...</p>
                </div>
              ) : (
                alertHistory.map((alert, i) => (
                  <div key={alert._id || alert.id || i} className={`alert-panel-item ${alert.isAnomaly ? "alert-anomaly" : ""}`}>
                    <div className={`alert-dot ${alert.riskLevel === "HIGH" ? "" : "alert-dot-medium"}`} />
                    <div className="alert-text">
                      <strong>{alert.username || alert.user || "Unknown"}</strong>
                      {" — "}
                      <span style={{ color: alert.riskLevel === "HIGH" ? "var(--risk-high)" : "var(--risk-medium)" }}>
                        {alert.riskLevel}
                      </span>
                      {" risk"}
                      {alert.isAnomaly && <span className="anomaly-flag" style={{ marginLeft: 8 }}><Zap size={12} /> Anomaly</span>}
                      {alert.reason ? <div style={{ marginTop: 4, color: "var(--text-muted)", fontSize: "0.78rem" }}>{alert.reason}</div> : ""}
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 2 }}>
                        {alert.action?.substring(0, 100)}
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                        {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "Just now"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* === POLICIES TAB === */}
        {activeTab === "policies" && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              <Shield size={18} />
              Governance Policies
            </div>
            <PolicyManager
              policies={policies}
              onUpdate={fetchPolicies}
            />
          </div>
        )}
      </div>
    </div>
  );
}