import { useEffect, useState } from "react";
import { AlertTriangle, Clock, X } from "lucide-react";

export function AlertToast({ alert, onDismiss }) {
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissing(true);
    setTimeout(() => onDismiss?.(), 300);
  };

  const isApprovalRequest = alert.type === "approval_request";

  return (
    <div className={`alert-toast ${dismissing ? "dismissing" : ""}`}>
      <div className="alert-toast-header">
        <span className="alert-toast-title">
          {isApprovalRequest ? <Clock size={14} /> : <AlertTriangle size={14} />}
          {isApprovalRequest ? "New Approval Request" : "Alert"}
        </span>
        <button className="btn-icon" onClick={handleDismiss} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
      <div className="alert-toast-body">
        {isApprovalRequest ? (
          <>
            <strong>{alert.user || "An employee"}</strong> submitted an action awaiting your approval.
          </>
        ) : (
          <>
            <strong>{alert.user || "Unknown user"}</strong> triggered a{" "}
            <strong style={{ color: "var(--risk-high)" }}>
              {alert.riskLevel || "HIGH"}
            </strong>{" "}
            risk alert.
            {alert.reason && <> Reason: {alert.reason}</>}
          </>
        )}
      </div>
      <div className="alert-toast-time">
        {alert.timestamp
          ? new Date(alert.timestamp).toLocaleTimeString()
          : "Just now"}
      </div>
    </div>
  );
}

