import { useState } from "react";
import { Send, AlertTriangle, ShieldCheck, ShieldAlert, RotateCcw } from "lucide-react";
import { submitActivityAPI } from "../services/api";
import { RiskBadge } from "./RiskBadge";

/**
 * ActivityForm — lets users submit free-text input for risk analysis.
 */
export function ActivityForm({ onActivityCreated }) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const MAX_CHARS = 1000;
  const MIN_CHARS = 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || trimmed.length < MIN_CHARS) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await submitActivityAPI(trimmed);
      setResult(res.data);
      onActivityCreated?.(res.data.activity);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
    setError("");
  };

  const getStatusIcon = (riskLevel) => {
    if (riskLevel === "LOW") return <ShieldCheck size={18} style={{ color: "var(--risk-low)" }} />;
    if (riskLevel === "MEDIUM") return <AlertTriangle size={18} style={{ color: "var(--risk-medium)" }} />;
    return <ShieldAlert size={18} style={{ color: "var(--risk-high)" }} />;
  };

  const getResultClass = (riskLevel) => {
    if (riskLevel === "LOW") return "result-allowed";
    if (riskLevel === "MEDIUM") return "result-warned";
    return "result-blocked";
  };

  const charsLeft = MAX_CHARS - inputText.length;
  const isOverLimit = inputText.length > MAX_CHARS;
  const isTooShort = inputText.trim().length > 0 && inputText.trim().length < MIN_CHARS;

  return (
    <div className="prompt-form">
      <form onSubmit={handleSubmit}>
        <div>
          <label className="label" htmlFor="activity-input">
            What would you like to do?
          </label>
          <textarea
            id="activity-input"
            className="textarea"
            placeholder="Describe your activity or enter a prompt. Example: export customer records, run a report, query the database..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            required
          />
          <div className="char-count" style={{ color: isOverLimit ? "var(--risk-high)" : undefined }}>
            {inputText.length} / {MAX_CHARS} characters
            {isOverLimit && " — too long"}
            {isTooShort && " — too short (min 3)"}
          </div>
        </div>

        {error && (
          <div className="login-error" style={{ marginTop: 8 }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || isOverLimit || isTooShort || !inputText.trim()}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Analyzing risk...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Activity
              </>
            )}
          </button>

          {(result || inputText) && (
            <button type="button" className="btn btn-ghost" onClick={handleClear}>
              <RotateCcw size={14} />
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Risk result panel */}
      {result && (
        <div className={`action-result ${getResultClass(result.riskAnalysis?.riskLevel)}`}>
          <div className="action-result-header">
            <div className="action-result-status">
              {getStatusIcon(result.riskAnalysis?.riskLevel)}
              <span className="action-result-status-text">
                {result.riskAnalysis?.riskLevel === "LOW" && "✅ Activity Submitted — Low Risk"}
                {result.riskAnalysis?.riskLevel === "MEDIUM" && "⚠️ Medium Risk Detected"}
                {result.riskAnalysis?.riskLevel === "HIGH" && "🚫 High Risk — Activity Blocked"}
              </span>
            </div>
            <RiskBadge level={result.riskAnalysis?.riskLevel} />
          </div>

          <div className="action-result-message">
            {result.riskAnalysis?.reason}
          </div>

          <div className="action-result-meta">
            <span>Confidence: {result.riskAnalysis?.confidence != null ? `${(result.riskAnalysis.confidence * 100).toFixed(0)}%` : "—"}</span>
            <span>Status: {result.activity?.status}</span>
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
        </div>
      )}
    </div>
  );
}
