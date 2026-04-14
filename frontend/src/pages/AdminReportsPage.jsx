import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { FileText, Download, Filter, Calendar, ShieldAlert, AlertTriangle, ShieldCheck, Loader } from "lucide-react";
import { exportReportAPI } from "../services/api";

const RISK_OPTIONS   = ["all", "HIGH", "MEDIUM", "LOW"];
const STATUS_OPTIONS = ["all", "PENDING", "APPROVED", "FLAGGED", "BLOCKED"];

export default function AdminReportsPage() {
  const [format,    setFormat]    = useState("csv");
  const [riskLevel, setRiskLevel] = useState("all");
  const [status,    setStatus]    = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [lastExport, setLastExport] = useState(null);

  const handleExport = async () => {
    setError("");
    setLoading(true);
    try {
      const params = { format };
      if (riskLevel !== "all") params.riskLevel = riskLevel;
      if (status    !== "all") params.status    = status;
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;

      const res = await exportReportAPI(params);

      const mime = format === "pdf" ? "application/pdf" : "text/csv";
      const blob = new Blob([res.data], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `governance-report-${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setLastExport(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="dashboard-welcome">
          <h1>Activity <span className="text-gradient">Reports</span></h1>
          <p>Export filtered activity data as CSV or PDF for compliance and auditing.</p>
        </div>

        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Format */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-title" style={{ marginBottom: 20 }}>
              <FileText size={18} />
              Export Format
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {["csv", "pdf"].map((f) => (
                <button
                  key={f}
                  className={`btn ${format === f ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setFormat(f)}
                  style={{ minWidth: 130 }}
                >
                  {f === "csv" ? "📊  CSV Spreadsheet" : "📄  PDF Document"}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
              {format === "csv"
                ? "All fields included: username, activity, risk level, status, timestamp, confidence, reason."
                : "Formatted PDF with summary statistics and a table of the top 50 activities."}
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-title" style={{ marginBottom: 20 }}>
              <Filter size={18} />
              Filters
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Risk Level
                </label>
                <select className="select" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                  {RISK_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o === "all" ? "All Levels" : o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Status
                </label>
                <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o === "all" ? "All Statuses" : o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  <Calendar size={12} style={{ display: "inline", marginRight: 4 }} />
                  Start Date
                </label>
                <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  <Calendar size={12} style={{ display: "inline", marginRight: 4 }} />
                  End Date
                </label>
                <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card" style={{ padding: 16, background: "rgba(37,99,235,0.06)", borderColor: "rgba(37,99,235,0.18)" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-primary)" }}>Export summary: </strong>
              {format.toUpperCase()} · {riskLevel !== "all" ? riskLevel : "all risk levels"} · {status !== "all" ? status : "all statuses"}
              {(startDate || endDate) ? ` · ${startDate || "beginning"} → ${endDate || "now"}` : " · all dates"}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { icon: <ShieldAlert  size={14} />, label: "HIGH — Immediate action",  color: "#dc2626" },
              { icon: <AlertTriangle size={14} />, label: "MEDIUM — Review needed",   color: "#d97706" },
              { icon: <ShieldCheck  size={14} />, label: "LOW — Safe",               color: "#16a34a" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: item.color }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "12px 16px", background: "rgba(220,38,38,0.1)", borderRadius: 8, color: "#dc2626", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Export button */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn btn-primary" onClick={handleExport} disabled={loading} style={{ minWidth: 190 }}>
              {loading
                ? <><Loader size={15} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />Generating…</>
                : <><Download size={15} style={{ marginRight: 6 }} />Export as {format.toUpperCase()}</>}
            </button>
            {lastExport && (
              <span style={{ fontSize: 12, color: "#16a34a" }}>✅ Last exported at {lastExport}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
