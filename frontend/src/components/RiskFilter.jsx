import { Filter, X } from "lucide-react";

const RISK_OPTIONS = [
  { value: "all", label: "All Risk Levels" },
  { value: "LOW", label: "Low Risk" },
  { value: "MEDIUM", label: "Medium Risk" },
  { value: "HIGH", label: "High Risk" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "FLAGGED", label: "Flagged" },
  { value: "APPROVED", label: "Approved" },
  { value: "BLOCKED", label: "Blocked" },
];

/**
 * RiskFilter — search and filter controls for the activity monitoring dashboard.
 *
 * @param {object}   filters       - { riskLevel, status, search, startDate, endDate }
 * @param {function} onFilterChange - (updatedFilters) => void
 * @param {function} onClear       - clear all filters
 */
export function RiskFilter({ filters = {}, onFilterChange, onClear }) {
  const activeCount = [
    filters.riskLevel && filters.riskLevel !== "all",
    filters.status && filters.status !== "all",
    filters.search,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length;

  const set = (key, value) => onFilterChange?.({ ...filters, [key]: value });

  return (
    <div className="filter-bar" style={{ flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "0.82rem" }}>
        <Filter size={14} />
        Filters
        {activeCount > 0 && (
          <span className="tab-badge">{activeCount}</span>
        )}
      </div>

      <select
        className="select"
        value={filters.riskLevel || "all"}
        onChange={(e) => set("riskLevel", e.target.value)}
        style={{ minWidth: 150, width: "auto" }}
      >
        {RISK_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        className="select"
        value={filters.status || "all"}
        onChange={(e) => set("status", e.target.value)}
        style={{ minWidth: 150, width: "auto" }}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <input
        className="input"
        placeholder="Search by text..."
        value={filters.search || ""}
        onChange={(e) => set("search", e.target.value)}
        style={{ maxWidth: 220 }}
      />

      <input
        type="date"
        className="input"
        value={filters.startDate || ""}
        onChange={(e) => set("startDate", e.target.value)}
        style={{ maxWidth: 160 }}
        title="From date"
      />

      <input
        type="date"
        className="input"
        value={filters.endDate || ""}
        onChange={(e) => set("endDate", e.target.value)}
        style={{ maxWidth: 160 }}
        title="To date"
      />

      {activeCount > 0 && (
        <button className="btn btn-ghost btn-sm" onClick={onClear} title="Clear all filters">
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
