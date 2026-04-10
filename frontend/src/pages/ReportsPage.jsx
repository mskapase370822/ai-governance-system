import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { FileText, Download, FileBarChart, Calendar, ShieldAlert, Filter } from "lucide-react";
import { exportReportAPI } from "../services/api";

const RISK_OPTIONS = [
  { value: "all", label: "All Risk Levels" },
  { value: "HIGH", label: "High Risk" },
  { value: "MEDIUM", label: "Medium Risk" },
  { value: "LOW", label: "Low Risk" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "FLAGGED", label: "Flagged" },
  { value: "APPROVED", label: "Approved" },
  { value: "BLOCKED", label: "Blocked" },
];

export default function ReportsPage() {
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    riskLevel: "all",
    status: "all",
  });
  const [loading, setLoading] = useState(null); // 'csv' | 'pdf' | null
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleExport = async (format) => {
    setLoading(format);
    setError(null);
    setSuccess(null);
    try {
      const res = await exportReportAPI({ ...form, format });
      // Create a download link
      const blob = new Blob([res.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `activity-report-${date}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess(`${format.toUpperCase()} report downloaded successfully!`);
    } catch (err) {
      setError(err.response?.data?.error || "Export failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="dashboard-welcome">
          <h1>Export <span className="text-gradient">Reports</span></h1>
          <p>Generate and download activity reports in CSV or PDF format.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900 }}>
          {/* Filters card */}
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <div className="card-header">
              <div className="card-title"><Filter size={16} /> Filter Options</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "0 0 8px" }}>
              {/* Date range */}
              <div>
                <label className="form-label">
                  <Calendar size={13} style={{ display: "inline", marginRight: 4 }} />
                  Start Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                />
              </div>

              {/* Risk level */}
              <div>
                <label className="form-label">
                  <ShieldAlert size={13} style={{ display: "inline", marginRight: 4 }} />
                  Risk Level
                </label>
                <select
                  className="input"
                  value={form.riskLevel}
                  onChange={(e) => handleChange("riskLevel", e.target.value)}
                >
                  {RISK_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="form-label">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>
            )}
            {success && (
              <div className="alert alert-success" style={{ marginTop: 12 }}>{success}</div>
            )}
          </div>

          {/* CSV export card */}
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>CSV Export</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
              Spreadsheet format. Compatible with Excel, Google Sheets.
              Includes summary stats and all activity details.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => handleExport("csv")}
              disabled={loading !== null}
              style={{ width: "100%" }}
            >
              {loading === "csv" ? (
                <><div className="spinner spinner-sm" /> Generating CSV…</>
              ) : (
                <><Download size={15} /> Export as CSV</>
              )}
            </button>
          </div>

          {/* PDF export card */}
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>PDF Report</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
              Professional report with summary, risk breakdown, and activity table.
              Includes confidentiality footer.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => handleExport("pdf")}
              disabled={loading !== null}
              style={{ width: "100%" }}
            >
              {loading === "pdf" ? (
                <><div className="spinner spinner-sm" /> Generating PDF…</>
              ) : (
                <><FileBarChart size={15} /> Export as PDF</>
              )}
            </button>
          </div>

          {/* Info card */}
          <div className="card" style={{ gridColumn: "1 / -1", background: "var(--bg-subtle, #f8fafc)" }}>
            <div className="card-title" style={{ marginBottom: 12 }}>
              <FileText size={16} /> Export Notes
            </div>
            <ul style={{ color: "var(--text-muted)", fontSize: 14, paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
              <li>Reports export up to <strong>5,000 activities</strong> matching your filters.</li>
              <li>PDF reports show the first <strong>100 rows</strong> in the table (all data in CSV).</li>
              <li>Leave date fields empty to export all time periods.</li>
              <li>For daily automated reports, configure email settings in <strong>Email Settings</strong>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
