import { useEffect, useState, useCallback } from "react";
import { Navbar } from "../components/Navbar";
import { ActivityForm } from "../components/ActivityForm";
import { ActivityTable } from "../components/ActivityTable";
import { StatsCard } from "../components/StatsCard";
import { FileText, ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";
import { getMyActivitiesAPI } from "../services/api";

export default function ActivityMonitoring() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchActivities = useCallback(async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await getMyActivitiesAPI(currentPage, 20);
      setActivities(res.data.activities || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities(page);
  }, [fetchActivities, page]);

  const handleActivityCreated = (newActivity) => {
    if (page === 1) {
      setActivities((prev) => [newActivity, ...prev]);
    } else {
      setPage(1); // jump to first page so user sees the new entry
    }
  };

  // Quick stats derived from current page (full stats would need a separate API call)
  const total = pagination?.total || 0;
  const highRisk = activities.filter((a) => a.riskLevel === "HIGH").length;
  const mediumRisk = activities.filter((a) => a.riskLevel === "MEDIUM").length;
  const lowRisk = activities.filter((a) => a.riskLevel === "LOW").length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="dashboard-welcome">
          <h1>My Activity <span className="text-gradient">Monitoring</span></h1>
          <p>Submit text prompts and view your risk analysis history.</p>
        </div>

        {/* Stats row */}
        <div className="grid-stats">
          <StatsCard title="Total Submissions" value={total} icon={FileText} color="blue" />
          <StatsCard title="Low Risk" value={lowRisk} icon={ShieldCheck} color="green" />
          <StatsCard title="Medium Risk" value={mediumRisk} icon={AlertTriangle} color="yellow" />
          <StatsCard title="High Risk" value={highRisk} icon={ShieldAlert} color="red" />
        </div>

        {/* Submission form */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>
            <FileText size={18} />
            Submit Activity
          </div>
          <ActivityForm onActivityCreated={handleActivityCreated} />
        </div>

        {/* Activity history */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="card-header" style={{ padding: "20px 24px", marginBottom: 0, borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="card-title">
              <FileText size={18} />
              My Activity History
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchActivities(page)}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : (
            <div style={{ padding: "0 0 8px" }}>
              <ActivityTable
                activities={activities}
                isAdmin={false}
                pagination={pagination}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
