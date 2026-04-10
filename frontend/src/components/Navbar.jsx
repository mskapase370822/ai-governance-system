import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LogOut, Menu, X, Shield } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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