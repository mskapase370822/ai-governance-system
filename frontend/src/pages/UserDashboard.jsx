import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { StatsCard } from "../components/StatsCard";
import { LogTable } from "../components/LogTable";
import { PromptForm } from "../components/PromptForm";
import { FileText, ShieldCheck, AlertTriangle, ShieldAlert, Send, Clock } from "lucide-react";
import { getMyLogsAPI, getUserStatsAPI, getMyApprovalsAPI } from "../services/api";

export default function UserDashboard() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes, approvalsRes] = await Promise.all([
        getMyLogsAPI({ limit: 50 }),
        getUserStatsAPI(),
        getMyApprovalsAPI(),
      ]);
      setLogs(logsRes.data.logs || logsRes.data);
      setStats(statsRes.data);
      setApprovals(approvalsRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogCreated = (newLog) => {
    setLogs((prev) => [newLog, ...prev.filter((log) => log._id !== newLog._id)]);
    // Refresh stats and approvals after a new submission
    getUserStatsAPI().then((res) => setStats(res.data)).catch(() => {});
    getMyApprovalsAPI().then((res) => setApprovals(res.data)).catch(() => {});
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        {/* Welcome */}
        <div className="dashboard-welcome">
          <h1>
            Employee <span className="text-gradient">Dashboard</span>
          </h1>
          <p>Submit actions for risk assessment and view your activity history.</p>
        </div>

        {/* Stats */}
        <div className="grid-stats">
          <StatsCard
            title="Total Actions"
            value={stats.totalLogs || 0}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            title="Safe Actions"
            value={stats.lowRisk || 0}
            icon={ShieldCheck}
            color="green"
          />
          <StatsCard
            title="Warnings"
            value={stats.mediumRisk || 0}
            icon={AlertTriangle}
            color="yellow"
          />
          <StatsCard
            title="Blocked"
            value={stats.blocked || 0}
            icon={ShieldAlert}
            color="red"
          />
        </div>

        {/* Main content grid */}
        <div className="grid-2col">
          {/* Prompt submission */}
          <div className="card">
            <div className="card-title">
              <Send size={18} />
              Submit an Action
            </div>
            <PromptForm onLogCreated={handleLogCreated} />
          </div>

          {/* Pending approvals */}
          <div className="card">
            <div className="card-title">
              <Clock size={18} />
              My Approval Requests
            </div>
            {approvals.length === 0 ? (
              <div className="approval-empty">
                <Clock size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No pending approval requests</p>
              </div>
            ) : (
              <div className="my-approvals-list">
                {approvals.slice(0, 10).map((a) => (
                  <div key={a._id} className={`my-approval-item status-${a.status}`}>
                    <div className="my-approval-action">{a.action?.substring(0, 80)}...</div>
                    <div className="my-approval-footer">
                      <span className={`status-badge status-${a.status === "pending" ? "pending" : a.status === "approved" ? "allowed" : "blocked"}`}>
                        {a.status === "pending" && <Clock size={12} />}
                        {a.status === "approved" && <ShieldCheck size={12} />}
                        {a.status === "denied" && <ShieldAlert size={12} />}
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </span>
                      <span className="approval-time">
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {a.reviewedByUsername && (
                      <div className="my-approval-reviewer">
                        Reviewed by: {a.reviewedByUsername}
                        {a.reviewNote ? ` — "${a.reviewNote}"` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 24 }}>
          <div className="card-header" style={{ padding: "20px 24px", marginBottom: 0 }}>
            <div className="card-title">
              <FileText size={18} />
              Recent Activity
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchData}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <div className="spinner spinner-lg"></div>
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              <LogTable logs={Array.isArray(logs) ? logs.slice(0, 30) : []} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}