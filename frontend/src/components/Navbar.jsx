import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogOut, Menu, X, Shield, Activity, BarChart2, FileText, Heart, Mail } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDashboardPath = () => {
    if (user?.role === "Admin") return "/admin";
    if (user?.role === "Manager") return "/manager";
    return "/dashboard";
  };

  const role = (user?.role || "").toLowerCase();

  const navBtn = (path, icon, label) => (
    <button
      className={`btn btn-ghost btn-sm${location.pathname === path ? " active" : ""}`}
      onClick={() => { navigate(path); setMobileOpen(false); }}
      title={label}
    >
      {icon}
      <span className="navbar-link-label">{label}</span>
    </button>
  );

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => navigate(getDashboardPath())}>
          <div className="navbar-brand-icon">
            <Shield size={18} />
          </div>
          <span className="navbar-brand-text">
            AI Governance
          </span>
        </div>

        {/* Desktop right side */}
        <div className={`navbar-right ${mobileOpen ? "open" : ""}`}>
          {/* Activity Monitoring link — all authenticated users */}
          {navBtn("/activity/monitoring", <Activity size={15} />, "My Activities")}

          {/* Admin-only links */}
          {role === "admin" && (
            <>
              {navBtn("/admin/activities", <BarChart2 size={15} />, "Activity Dashboard")}
              {navBtn("/admin/reports", <FileText size={15} />, "Reports")}
              {navBtn("/admin/system-health", <Heart size={15} />, "System Health")}
              {navBtn("/admin/email-settings", <Mail size={15} />, "Email Settings")}
            </>
          )}

          <div className="navbar-user">
            <div className="avatar avatar-sm">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="navbar-user-info">
              <div className="navbar-user-name">{user?.username || "User"}</div>
              <div className="navbar-user-role">
                <span className={`role-dot role-${(user?.role || "Employee").toLowerCase()}`}></span>
                {user?.role || "Employee"}
              </div>
            </div>
          </div>
          <button className="navbar-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
}