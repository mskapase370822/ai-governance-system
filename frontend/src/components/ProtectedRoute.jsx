import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg-deepest)" }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Normalize role comparison (handles both "admin" and "Admin")
  const userRole = (user?.role || "").toLowerCase();

  if (allowedRoles) {
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    if (!normalizedAllowed.includes(userRole)) {
      if (userRole === "admin") return <Navigate to="/admin" replace />;
      if (userRole === "manager") return <Navigate to="/manager" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}