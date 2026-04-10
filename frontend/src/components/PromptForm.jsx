import { useState } from "react";
import { Send, AlertTriangle, ShieldCheck, ShieldAlert, ChevronDown } from "lucide-react";
import { submitActionAPI, confirmActionAPI } from "../services/api";
import { RiskBadge } from "./RiskBadge";

export function PromptForm({ onLogCreated }) {
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await submitActionAPI({ action });
      setResult(res.data);
      if (res.data.decision?.status === "allowed") {
        setAction("");
      }
      onLogCreated?.(res.data.log);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to submit input. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result?.log?._id) return;
    setLoading(true);
    try {
      const res = await confirmActionAPI(result.log._id);
      setResult((prev) => ({
        ...prev,
        log: res.data.log,
        decision: {
          ...prev?.decision,
          status: res.data.log.status,
          systemResponse: res.data.log.systemResponse,
        },
      }));
      setAction("");
      onLogCreated?.(res.data.log);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to confirm input.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "allowed": return <ShieldCheck size={18} style={{ color: "var(--risk-low)" }} />;
      case "warned": return <AlertTriangle size={18} style={{ color: "var(--risk-medium)" }} />;
      case "blocked":
      case "pending_approval":
      case "denied":
        return <ShieldAlert size={18} style={{ color: "var(--risk-high)" }} />;
      default: return null;
    }
  };

  const getStatusClass = (status) => {
    if (status === "allowed" || status === "approved") return "result-allowed";
    if (status === "warned") return "result-warned";
    return "result-blocked";
  };

  return (
    <div className="prompt-form">
      <form onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="action-text">User Input / Prompt</label>
          <textarea
            id="action-text"
            className="textarea"
            placeholder="Type what the user wants to do. Example: delete records, export user data, update config, run SQL..."
            value={action}
            onChange={(e) => setAction(e.target.value)}
            required
          />
          <div className="char-count">{action.length} characters</div>
        </div>

        {error && (
          <div className="login-error" style={{ marginTop: 8 }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <button
          id="action-submit"
          type="submit"
          className="btn btn-primary"
          disabled={loading || !action.trim()}
          style={{ marginTop: 4 }}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Logging & checking risk...
            </>
          ) : (
            <>
              <Send size={16} />
              Submit Input
            </>
          )}
        </button>
      </form>

      {/* Risk Result Panel */}
      {result && (
        <div className={`action-result ${getStatusClass(result.decision?.status)}`}>
          {/* Status header */}
          <div className="action-result-header">
            <div className="action-result-status">
              {getStatusIcon(result.decision?.status)}
              <span className="action-result-status-text">
                {result.decision?.status === "allowed" && "✅ Input Allowed"}
                {result.decision?.status === "warned" && "⚠️ Warning — Confirmation Required"}
                {result.decision?.status === "blocked" && "🚫 Input Blocked"}
                {result.decision?.status === "pending_approval" && "⏳ Pending Admin Approval"}
                {result.decision?.status === "approved" && "✅ Approved by Admin"}
                {result.decision?.status === "denied" && "❌ Denied by Admin"}
              </span>
            </div>
            <RiskBadge level={result.riskAnalysis?.riskLevel} />
          </div>

          {/* System response */}
          <div className="action-result-message">
            {result.decision?.systemResponse}
          </div>

          {/* Confidence bar */}
          <div className="action-result-meta">
            <span>Confidence: {result.riskAnalysis?.confidence != null ? `${(result.riskAnalysis.confidence * 100).toFixed(0)}%` : "—"}</span>
            <span>Category: {result.riskAnalysis?.category || "general"}</span>
          </div>
          <div className="confidence-bar">
            <div
              className={`confidence-fill ${
                result.riskAnalysis?.confidence > 0.7 ? "high" :
                result.riskAnalysis?.confidence > 0.4 ? "medium" : "low"
              }`}
              style={{ width: `${(result.riskAnalysis?.confidence || 0) * 100}%` }}
            />
          </div>

          {/* Anomaly warning */}
          {result.anomaly?.isAnomaly && (
            <div className="anomaly-warning">
              <AlertTriangle size={14} />
              <span>Anomaly Detected: {result.anomaly.anomalyReason}</span>
            </div>
          )}

          {/* Risk details toggle */}
          {result.riskAnalysis?.riskDetails?.length > 0 && (
            <div className="risk-details-section">
              <button
                className="risk-details-toggle"
                onClick={() => setShowDetails(!showDetails)}
              >
                <ChevronDown size={14} style={{ transform: showDetails ? "rotate(180deg)" : "none", transition: "0.2s" }} />
                {showDetails ? "Hide" : "Show"} Risk Details ({result.riskAnalysis.riskDetails.length})
              </button>
              {showDetails && (
                <ul className="risk-details-list">
                  {result.riskAnalysis.riskDetails.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Confirm button for warned actions */}
          {result.decision?.status === "warned" && (
            <div className="action-result-actions">
              <button className="btn btn-primary btn-sm" onClick={handleConfirm} disabled={loading}>
                <ShieldCheck size={14} />
                Confirm & Proceed
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setResult(null)}>
                Cancel
              </button>
            </div>
          )}

          {/* Pending approval info */}
          {result.decision?.status === "pending_approval" && result.approvalRequest && (
            <div className="action-result-pending">
              Your request has been submitted for Admin approval. Request ID: {result.approvalRequest.id?.slice(-6)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
