import { useState } from "react";
import { Flag, CheckCircle, ShieldOff, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import { flagActivityAPI, approveActivityAPI, blockActivityAPI } from "../services/api";

/**
 * ActivityTable — displays a list of user activity records.
 * @param {object[]} activities  - array of activity objects
 * @param {boolean}  isAdmin     - show admin action buttons
 * @param {object}   pagination  - { page, pages, total }
 * @param {function} onPageChange - (newPage) => void
 * @param {function} onUpdate    - called after admin action to refresh data
 */
export function ActivityTable({ activities = [], isAdmin = false, pagination, onPageChange, onUpdate }) {
  const [flagModal, setFlagModal] = useState(null); // activity being flagged
  const [flagReason, setFlagReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [detailModal, setDetailModal] = useState(null);

  const statusColors = {
    PENDING: "badge-medium",
    FLAGGED: "badge-high",
    APPROVED: "badge-low",
    BLOCKED: "badge-high",
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) return;
    setActionLoading(flagModal._id);
    setError("");
    try {
      await flagActivityAPI(flagModal._id, flagReason.trim());
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to flag activity.");
    } finally {
      setActionLoading(null);
      setFlagModal(null);
      setFlagReason("");
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    setError("");
    try {
      await approveActivityAPI(id);
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve activity.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (id) => {
    setActionLoading(id);
    setError("");
    try {
      await blockActivityAPI(id);
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to block activity.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!activities.length) {
    return (
      <div className="approval-empty" style={{ padding: "48px 0" }}>
        <Info size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
        <p>No activities found.</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="login-error" style={{ margin: "0 0 12px" }}>
          {error}
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Input Text</th>
              {isAdmin && <th>User</th>}
              <th>Risk</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>Timestamp</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr
                key={a._id}
                onClick={() => setDetailModal(a)}
                style={{ cursor: "pointer" }}
                title="Click for details"
              >
                <td style={{ maxWidth: 280 }}>
                  <span
                    className="log-action"
                    title={a.inputText}
                    style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}
                  >
                    {a.inputText}
                  </span>
                </td>
                {isAdmin && (
                  <td>
                    <span className="badge badge-role">{a.userId?.username || "—"}</span>
                  </td>
                )}
                <td onClick={(e) => e.stopPropagation()}>
                  <RiskBadge level={a.riskLevel} />
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <span className={`badge ${statusColors[a.status] || "badge-medium"}`}>
                    {a.status}
                  </span>
                </td>
                <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {a.confidence != null ? `${(a.confidence * 100).toFixed(0)}%` : "—"}
                </td>
                <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {new Date(a.timestamp).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                {isAdmin && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {a.status !== "FLAGGED" && (
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Flag"
                          disabled={actionLoading === a._id}
                          onClick={() => { setFlagModal(a); setFlagReason(""); }}
                        >
                          <Flag size={13} />
                        </button>
                      )}
                      {a.status !== "APPROVED" && (
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Approve"
                          disabled={actionLoading === a._id}
                          onClick={() => handleApprove(a._id)}
                          style={{ color: "var(--risk-low)" }}
                        >
                          <CheckCircle size={13} />
                        </button>
                      )}
                      {a.status !== "BLOCKED" && (
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Block"
                          disabled={actionLoading === a._id}
                          onClick={() => handleBlock(a._id)}
                          style={{ color: "var(--risk-high)" }}
                        >
                          <ShieldOff size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="filter-bar" style={{ justifyContent: "center", padding: "16px 0 0" }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange?.(pagination.page - 1)}
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => onPageChange?.(pagination.page + 1)}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Flag modal */}
      {flagModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => setFlagModal(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 440, margin: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-title" style={{ marginBottom: 16 }}>
              <Flag size={16} /> Flag Activity
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12 }}>
              {flagModal.inputText?.substring(0, 100)}…
            </p>
            <label className="label">Reason for flagging</label>
            <textarea
              className="textarea"
              rows={3}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Describe why this activity is being flagged..."
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleFlag}
                disabled={!flagReason.trim() || actionLoading}
              >
                <Flag size={13} /> Confirm Flag
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setFlagModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => setDetailModal(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 540, margin: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-title" style={{ marginBottom: 12 }}>
              <Info size={16} /> Activity Details
            </div>
            <div style={{ display: "grid", gap: 8, fontSize: "0.85rem" }}>
              {isAdmin && (
                <div><strong>User:</strong> {detailModal.userId?.username} ({detailModal.userId?.role})</div>
              )}
              <div><strong>Risk Level:</strong> <RiskBadge level={detailModal.riskLevel} /></div>
              <div>
                <strong>Status:</strong>{" "}
                <span className={`badge ${statusColors[detailModal.status] || "badge-medium"}`}>
                  {detailModal.status}
                </span>
              </div>
              <div><strong>Confidence:</strong> {detailModal.confidence != null ? `${(detailModal.confidence * 100).toFixed(0)}%` : "—"}</div>
              <div><strong>Timestamp:</strong> {new Date(detailModal.timestamp).toLocaleString()}</div>
              {detailModal.reason && <div><strong>Reason:</strong> {detailModal.reason}</div>}
              <div>
                <strong>Input Text:</strong>
                <p style={{ marginTop: 4, padding: 8, background: "var(--bg-card)", borderRadius: 6, wordBreak: "break-word", maxHeight: 150, overflowY: "auto" }}>
                  {detailModal.inputText}
                </p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={() => setDetailModal(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
