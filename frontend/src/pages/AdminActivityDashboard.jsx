import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { ActivityTable } from "../components/ActivityTable";
import { RiskFilter } from "../components/RiskFilter";
import { StatsCard } from "../components/StatsCard";
import { AlertToast } from "../components/AlertToast";
import { RiskTrendChart } from "../components/Charts/RiskTrendChart";
import { RiskDistributionChart } from "../components/Charts/RiskDistributionChart";
import { DailyActivityChart } from "../components/Charts/DailyActivityChart";
import { UserActivityChart } from "../components/Charts/UserActivityChart";
import { FileText, ShieldAlert, AlertTriangle, ShieldCheck, Flag, ShieldOff, BarChart2, ChevronDown } from "lucide-react";
import {
  getAllActivitiesAPI,
  getFilteredActivitiesAPI,
  getActivityStatsAPI,
  getRiskTrendAPI,
  getTopUsersAPI,
} from "../services/api";
import { initializeSocket, disconnectSocket } from "../services/websocket";

const EMPTY_FILTERS = { riskLevel: "all", status: "all", search: "", startDate: "", endDate: "" };
const DATE_RANGES = [
  { label: "7 Days", value: 7 },
  { label: "30 Days", value: 30 },
  { label: "90 Days", value: 90 },
];

export default function AdminActivityDashboard() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [chartDays, setChartDays] = useState(30);
  const [showCharts, setShowCharts] = useState(true);

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

  const fetchChartData = useCallback(async (days) => {
    try {
      const [trendRes, usersRes] = await Promise.all([
        getRiskTrendAPI(days),
        getTopUsersAPI(),
      ]);
      setTrendData(trendRes.data || []);
      setTopUsers(usersRes.data || []);
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchActivities(page, filters);
  }, [fetchActivities, page, filters]);

  useEffect(() => {
    fetchChartData(chartDays);
  }, [fetchChartData, chartDays]);

  // WebSocket — real-time alerts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = initializeSocket(token);
    socket.on("activity_alert", (data) => {
      setToasts((prev) => [...prev, { ...data, id: Date.now() }]);
      fetchStats();
      fetchChartData(chartDays);
    });

    return () => disconnectSocket();
  }, [fetchStats, fetchChartData, chartDays]);

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

        {/* Charts section */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCharts ? 20 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              <BarChart2 size={18} />
              Analytics Charts
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Date range selector */}
              {showCharts && (
                <div style={{ display: "flex", gap: 4 }}>
                  {DATE_RANGES.map((r) => (
                    <button
                      key={r.value}
                      className={`btn btn-sm ${chartDays === r.value ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setChartDays(r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCharts((v) => !v)}
              >
                <ChevronDown size={14} style={{ transform: showCharts ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                {showCharts ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {showCharts && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 20 }}>
              <RiskTrendChart data={trendData} />
              <RiskDistributionChart stats={s} />
              <DailyActivityChart data={trendData} />
              <UserActivityChart data={topUsers} />
            </div>
          )}
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
