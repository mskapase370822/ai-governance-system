import { useState } from "react";
import { Check, X, Clock, AlertTriangle, ChevronDown } from "lucide-react";
import { approveRequestAPI, denyRequestAPI } from "../services/api";
import { RiskBadge } from "./RiskBadge";

export function ApprovalPanel({ approvals, onUpdate }) {
  const [reviewNotes, setReviewNotes] = useState({});
  const [loading, setLoading] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const handleApprove = async (id) => {
    setLoading((p) => ({ ...p, [id]: "approving" }));
    try {
      await approveRequestAPI(id, reviewNotes[id] || "");
      onUpdate?.();
    } catch (err) {
      console.error("Approve failed:", err);
    } finally {
      setLoading((p) => ({ ...p, [id]: null }));
    }
  };

  const handleDeny = async (id) => {
    setLoading((p) => ({ ...p, [id]: "denying" }));
    try {
      await denyRequestAPI(id, reviewNotes[id] || "");
      onUpdate?.();
    } catch (err) {
      console.error("Deny failed:", err);
    } finally {
      setLoading((p) => ({ ...p, [id]: null }));
    }
  };

  if (!approvals || approvals.length === 0) {
    return (
      <div className="approval-empty">
        <Clock size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
        <p>No pending approval requests</p>
      </div>
    );
  }

  return (
    <div className="approval-list">
      {approvals.map((req) => (
        <div key={req._id} className="approval-item">
          <div className="approval-item-header" onClick={() => setExpandedId(expandedId === req._id ? null : req._id)}>
            <div className="approval-item-info">
              <div className="approval-user">
                <div className="avatar avatar-xs">
                  {(req.requestedByUsername || "?").charAt(0).toUpperCase()}
                </div>
                <strong>{req.requestedByUsername || "Unknown"}</strong>
                <span className="badge badge-role">{req.requestedByRole}</span>
              </div>
              <div className="approval-meta">
                <RiskBadge level={req.riskLevel} />
                <span className="approval-time">
                  {new Date(req.createdAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                </span>
              </div>
            </div>
            <ChevronDown
              size={16}
              style={{
                transform: expandedId === req._id ? "rotate(180deg)" : "none",
                transition: "0.2s",
                color: "var(--text-muted)",
              }}
            />
          </div>

          {expandedId === req._id && (
            <div className="approval-item-body">
              <div className="approval-action-text">
                <label className="label">Action Submitted:</label>
                <div className="approval-action-content">{req.action}</div>
              </div>

              {req.reason && (
                <div className="approval-reason">
                  <AlertTriangle size={14} />
                  <span>{req.reason}</span>
                </div>
              )}

              {req.riskDetails?.length > 0 && (
                <ul className="risk-details-list">
                  {req.riskDetails.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}

              <div className="approval-note-group">
                <input
                  className="input"
                  placeholder="Add a review note (optional)..."
                  value={reviewNotes[req._id] || ""}
                  onChange={(e) => setReviewNotes((p) => ({ ...p, [req._id]: e.target.value }))}
                />
              </div>

              <div className="approval-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleApprove(req._id)}
                  disabled={!!loading[req._id]}
                >
                  {loading[req._id] === "approving" ? <div className="spinner"></div> : <Check size={14} />}
                  Approve
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeny(req._id)}
                  disabled={!!loading[req._id]}
                >
                  {loading[req._id] === "denying" ? <div className="spinner"></div> : <X size={14} />}
                  Deny
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
