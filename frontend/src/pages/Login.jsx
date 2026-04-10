import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { User, Lock, AlertCircle, Shield } from "lucide-react";
import { loginAPI, registerAPI } from "../services/api";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await registerAPI({ username, password, role });
        setIsRegister(false);
        setError("");
        alert("Registration successful! Please log in.");
        setLoading(false);
        return;
      }

      const res = await loginAPI({ username, password });
      const { token, role: userRole, username: returnedName } = res.data;

      login({ username: returnedName || username, role: userRole }, token);

      // Case-insensitive role routing
      const r = (userRole || "").toLowerCase();
      if (r === "admin") navigate("/admin");
      else if (r === "manager") navigate("/manager");
      else navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-grid"></div>
        <div className="login-orb login-orb-1"></div>
        <div className="login-orb login-orb-2"></div>
        <div className="login-orb login-orb-3"></div>
      </div>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><Shield size={24} /></div>
          <span className="login-logo-text">AI <span className="text-gradient">Governance</span></span>
        </div>
        <p className="login-subtitle">
          {isRegister ? "Create your account to get started" : "Sign in to monitor AI risk & compliance"}
        </p>

        {error && (
          <div className="login-error"><AlertCircle size={16} />{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input id="login-username" type="text" className="input input-with-icon" placeholder="Username"
              value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
            <User size={18} className="input-icon" />
          </div>
          <div className="input-group">
            <input id="login-password" type="password" className="input input-with-icon" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} required
              autoComplete={isRegister ? "new-password" : "current-password"} />
            <Lock size={18} className="input-icon" />
          </div>

          {isRegister && (
            <div className="input-group" style={{ animationName: 'fade-in', animationDuration: '0.3s' }}>
              <label className="label" htmlFor="login-role">Role</label>
              <select id="login-role" className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          )}

          <button id="login-submit" type="submit" className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
            {loading ? (<><div className="spinner"></div>{isRegister ? "Creating Account..." : "Signing In..."}</>)
              : (<><Shield size={18} />{isRegister ? "Create Account" : "Sign In"}</>)}
          </button>
        </form>

        <div className="login-footer">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }}>
            {isRegister ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}