import { useState } from "react";
import { Send, AlertTriangle, ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { submitActionAPI } from "../services/api";

export function PromptForm({ onLogCreated }) {
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!action.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await submitActionAPI({ action });
      setResult(res.data);
      setAction("");
      onLogCreated?.(res.data.log);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to submit input. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending_approval": return <Clock size={18} style={{ color: "var(--risk-medium)" }} />;
      case "blocked":          return <ShieldAlert size={18} style={{ color: "var(--risk-high)" }} />;
      case "approved":         return <ShieldCheck size={18} style={{ color: "var(--risk-low)" }} />;
      case "denied":           return <ShieldAlert size={18} style={{ color: "var(--risk-high)" }} />;
      default:                 return null;
    }
  };

  const getStatusClass = (status) => {
    if (status === "approved") return "result-allowed";
    if (status === "pending_approval") return "result-warned";
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
            placeholder="Type what you want to do. Example: delete records, export user data, update config, run SQL..."
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
              Submitting...
            </>
          ) : (
            <>
              <Send size={16} />
              Submit for Approval
            </>
          )}
        </button>
      </form>

      {/* Submission Result */}
      {result && (
        <div className={`action-result ${getStatusClass(result.decision?.status)}`}>
          <div className="action-result-header">
            <div className="action-result-status">
              {getStatusIcon(result.decision?.status)}
              <span className="action-result-status-text">
                {result.decision?.status === "pending_approval" && "⏳ Submitted — Awaiting Admin Approval"}
                {result.decision?.status === "blocked" && "🚫 Action Blocked by Policy"}
                {result.decision?.status === "approved" && "✅ Approved by Admin"}
                {result.decision?.status === "denied" && "❌ Rejected by Admin"}
              </span>
            </div>
          </div>

          <div className="action-result-message">
            {result.decision?.systemResponse}
          </div>

          {result.decision?.status === "pending_approval" && result.approvalRequest && (
            <div className="action-result-pending">
              Request ID: {result.approvalRequest.id?.slice(-6)} — Your request is now visible in "My Approval Requests".
            </div>
          )}
        </div>
      )}
    </div>
  );
}

