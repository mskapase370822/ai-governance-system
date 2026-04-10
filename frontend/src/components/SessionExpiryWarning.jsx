import { useEffect, useState, useRef } from "react";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const WARN_BEFORE_MS = 5 * 60 * 1000; // warn 5 minutes before expiry

/**
 * Reads the JWT expiry from the stored token and shows a dismissible toast
 * when fewer than 5 minutes remain in the session. Auto-logs out on expiry.
 */
export function SessionExpiryWarning() {
  const { token, logout } = useAuth();
  const [minutesLeft, setMinutesLeft] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    let expMs;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      expMs = payload.exp * 1000;
    } catch {
      return; // malformed token — auth middleware will catch it
    }

    const tick = () => {
      const remaining = expMs - Date.now();
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        logout();
        return;
      }
      if (remaining <= WARN_BEFORE_MS) {
        setMinutesLeft(Math.ceil(remaining / 60_000));
        // Do not reset `dismissed` — once the user dismisses the toast,
        // auto-logout on expiry is still handled by the interval above.
      } else {
        setMinutesLeft(null);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 30_000); // re-check every 30 s

    return () => clearInterval(intervalRef.current);
  }, [token, logout]);

  if (!minutesLeft || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        background: "var(--bg-card, #1e293b)",
        border: "1px solid var(--risk-medium, #f59e0b)",
        borderRadius: "0.75rem",
        padding: "1rem 1.25rem",
        maxWidth: "340px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        color: "var(--text-primary, #e2e8f0)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
      role="alert"
      aria-live="polite"
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Clock size={16} color="var(--risk-medium, #f59e0b)" />
        <strong style={{ fontSize: "0.875rem" }}>
          Session expiring in {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""}
        </strong>
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted, #94a3b8)", margin: 0 }}>
        Your session will expire soon. Save your work and log in again to continue.
      </p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          className="btn btn-secondary"
          style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
        <button
          className="btn btn-danger"
          style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
          onClick={logout}
        >
          <LogOut size={13} />
          Logout now
        </button>
      </div>
    </div>
  );
}
