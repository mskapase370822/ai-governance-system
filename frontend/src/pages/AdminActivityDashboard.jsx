import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { ActivityTable } from "../components/ActivityTable";
import { RiskFilter } from "../components/RiskFilter";
import { StatsCard } from "../components/StatsCard";
import { AlertToast } from "../components/AlertToast";
import { FileText, ShieldAlert, AlertTriangle, ShieldCheck, Flag, ShieldOff } from "lucide-react";
import {
  getAllActivitiesAPI,
  getFilteredActivitiesAPI,
  getActivityStatsAPI,
} from "../services/api";
import { initializeSocket, disconnectSocket } from "../services/websocket";

const EMPTY_FILTERS = { riskLevel: "all", status: "all", search: "", startDate: "", endDate: "" };

export default function AdminActivityDashboard() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const isFiltered = Object.entries(filters).some(
    ([k, v]) => v && ((k === "riskLevel" || k === "status") ? v !== "all" : true)
  );

  const fetchActivities = useCallback(async (currentPage = 1, currentFilters = EMPTY_FILTERS) => {
    try {
      setLoading(true);
      let res;
      const hasFilter = Object.entries(currentFilters).some(
        ([k, v]) => v && ((k === "riskLevel" || k === "status") ? v !== "all" : true)
      );

      if (hasFilter) {
        res = await getFilteredActivitiesAPI({ ...currentFilters, page: currentPage, limit: 20 });
      } else {
        res = await getAllActivitiesAPI(currentPage, 20);
      }
      setActivities(res.data.activities || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getActivityStatsAPI();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchActivities(page, filters);
  }, [fetchActivities, page, filters]);

  // WebSocket — real-time alerts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = initializeSocket(token);
    socket.on("activity_alert", (data) => {
      setToasts((prev) => [...prev, { ...data, id: Date.now() }]);
      fetchStats();
    });

    return () => disconnectSocket();
  }, [fetchStats]);

  const handleFilterChange = (updated) => {
    setFilters(updated);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const s = stats || {};

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* Floating toasts */}
      <div className="alert-container">
        {toasts.map((t) => (
          <AlertToast key={t.id} alert={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>

      <div className="page-content">
        <div className="dashboard-welcome">
          <h1>User Activity <span className="text-gradient">Monitoring Dashboard</span></h1>
          <p>Monitor all user-submitted activities, assess risk levels, and take action.</p>
        </div>

        {/* Stats cards */}
        <div className="grid-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <StatsCard title="Total Activities" value={s.total || 0} icon={FileText} color="blue" />
          <StatsCard title="High Risk" value={s.highRisk || 0} icon={ShieldAlert} color="red" />
          <StatsCard title="Medium Risk" value={s.mediumRisk || 0} icon={AlertTriangle} color="yellow" />
          <StatsCard title="Low Risk" value={s.lowRisk || 0} icon={ShieldCheck} color="green" />
          <StatsCard title="Flagged" value={s.flagged || 0} icon={Flag} color="yellow" />
          <StatsCard title="Blocked" value={s.blocked || 0} icon={ShieldOff} color="red" />
        </div>

        {/* Table card */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="card-header" style={{ padding: "20px 24px", marginBottom: 0, borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="card-title">
              <FileText size={18} />
              All User Activities
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchActivities(page, filters)}>
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div style={{ padding: "16px 24px 0" }}>
            <RiskFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : (
            <div style={{ padding: "0 0 8px" }}>
              <ActivityTable
                activities={activities}
                isAdmin={true}
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
                onUpdate={() => {
                  fetchActivities(page, filters);
                  fetchStats();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
