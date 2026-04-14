import { RiskBadge } from "./RiskBadge";
import { FileText, AlertTriangle, ShieldCheck, ShieldAlert, Clock } from "lucide-react";

const statusConfig = {
  allowed: { label: "Allowed", className: "status-allowed", icon: ShieldCheck },
  warned: { label: "Warned", className: "status-warned", icon: AlertTriangle },
  blocked: { label: "Blocked", className: "status-blocked", icon: ShieldAlert },
  pending_approval: { label: "Pending", className: "status-pending", icon: Clock },
  approved: { label: "Approved", className: "status-allowed", icon: ShieldCheck },
  denied: { label: "Denied", className: "status-blocked", icon: ShieldAlert },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.allowed;
  const Icon = config.icon;
  return (
    <span className={`status-badge ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

export function LogTable({ logs, isAdmin = false }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {isAdmin && <th>User</th>}
            <th>Action</th>
            <th>Risk</th>
            <th>Status</th>
            <th>Confidence</th>
            {isAdmin && <th>Anomaly</th>}
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id || log.id} className={log.isAnomaly ? "row-anomaly" : ""}>
              {isAdmin && (
                <td className="cell-primary">
                  <div className="user-cell">
                    <div className="avatar avatar-xs">
                      {(log.userId?.username || log.user?.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div>{log.userId?.username || log.user?.username || "N/A"}</div>
                      <div className="cell-role">{log.userId?.role || log.userRole || ""}</div>
                    </div>
                  </div>
                </td>
              )}
              <td className="cell-truncate" title={log.action}>
                <div style={{ display: "grid", gap: 4 }}>
                  <span>{log.action}</span>
                  {(log.reason || log.systemResponse) && (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                      {log.reason || log.systemResponse}
                    </span>
                  )}
                </div>
              </td>
              <td>
                <RiskBadge level={log.riskLevel} />
              </td>
              <td>
                <StatusBadge status={log.status} />
              </td>
              <td>
                {log.confidence != null
                  ? `${(log.confidence * 100).toFixed(0)}%`
                  : "—"}
              </td>
              {isAdmin && (
                <td>
                  {log.isAnomaly ? (
                    <span className="anomaly-flag" title={log.anomalyReason}>
                      <AlertTriangle size={14} />
                      Yes
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
              )}
              <td className="cell-time">
                {log.timestamp || log.createdAt
                  ? new Date(log.timestamp || log.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
        <div className="table-empty">
          <FileText size={40} />
          <p>No logs found</p>
        </div>
      )}
    </div>
  );
}