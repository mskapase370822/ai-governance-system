import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

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

  return (
    <div className={`alert-toast ${dismissing ? "dismissing" : ""}`}>
      <div className="alert-toast-header">
        <span className="alert-toast-title">
          <AlertTriangle size={14} />
          Risk Alert
        </span>
        <button className="btn-icon" onClick={handleDismiss} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
      <div className="alert-toast-body">
        <strong>{alert.user || "Unknown user"}</strong> triggered a{" "}
        <strong style={{ color: "var(--risk-high)" }}>
          {alert.riskLevel || "HIGH"}
        </strong>{" "}
        risk alert.
        {alert.reason && <> Reason: {alert.reason}</>}
      </div>
      <div className="alert-toast-time">
        {alert.timestamp
          ? new Date(alert.timestamp).toLocaleTimeString()
          : "Just now"}
      </div>
    </div>
  );
}
