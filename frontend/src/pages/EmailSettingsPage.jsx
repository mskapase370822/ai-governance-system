import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { Mail, Bell, Clock, Users, TestTube, Save, Check, AlertCircle } from "lucide-react";
import { getEmailSettingsAPI, sendTestEmailAPI } from "../services/api";

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    getEmailSettingsAPI()
      .then((res) => setSettings(res.data))
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  const handleTest = async () => {
    if (!testEmail.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      await sendTestEmailAPI(testEmail.trim());
      setTestResult({ success: true, message: `Test email sent to ${testEmail}!` });
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.error || "Failed to send test email." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="dashboard-welcome">
          <h1>Email <span className="text-gradient">Settings</span></h1>
          <p>Configure email alerts and notification preferences.</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900 }}>
            {/* Configuration status */}
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <div className="card-title" style={{ marginBottom: 16 }}>
                <Mail size={16} /> Email Configuration Status
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: settings?.configured ? "#f0fdf4" : "#fff7ed",
                  border: `1px solid ${settings?.configured ? "#bbf7d0" : "#fed7aa"}`,
                  marginBottom: 16,
                }}
              >
                {settings?.configured ? (
                  <Check size={18} color="#16a34a" />
                ) : (
                  <AlertCircle size={18} color="#d97706" />
                )}
                <div>
                  <div style={{ fontWeight: 700, color: settings?.configured ? "#15803d" : "#92400e", fontSize: 14 }}>
                    {settings?.configured ? "Email is configured and ready" : "Email not configured"}
                  </div>
                  {!settings?.configured && (
                    <div style={{ color: "#b45309", fontSize: 13, marginTop: 2 }}>
                      Add EMAIL_USER and EMAIL_PASSWORD to your backend .env file to enable email alerts.
                    </div>
                  )}
                </div>
              </div>

              {settings?.configured && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ background: "var(--bg-subtle, #f9fafb)", borderRadius: 8, padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Service</div>
                    <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{settings?.service}</div>
                  </div>
                  <div style={{ background: "var(--bg-subtle, #f9fafb)", borderRadius: 8, padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Sender</div>
                    <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{settings?.emailUser || "—"}</div>
                  </div>
                  <div style={{ background: "var(--bg-subtle, #f9fafb)", borderRadius: 8, padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Admin Email</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{settings?.adminEmail || "Not set"}</div>
                  </div>
                  <div style={{ background: "var(--bg-subtle, #f9fafb)", borderRadius: 8, padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>Frontend URL</div>
                    <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>{settings?.frontendUrl}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Alert toggles */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>
                <Bell size={16} /> Alert Preferences
              </div>

              {[
                { key: "highRiskAlerts", label: "High Risk Alerts", desc: "Send email when HIGH risk activity is detected", icon: "🚨" },
                { key: "dailySummaries", label: "Daily Summaries", desc: "Automated daily report at 8:00 AM", icon: "📊" },
                { key: "approvalRequests", label: "Approval Requests", desc: "Email when approval is requested", icon: "🔔" },
              ].map(({ key, label, desc, icon }) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{desc}</div>
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 999,
                      background: settings?.features?.[key] ? "#22c55e" : "#d1d5db",
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: settings?.features?.[key] ? 20 : 2,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                </div>
              ))}

              <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 12 }}>
                Alert preferences are controlled via the backend .env configuration.
                Set EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD, and ADMIN_EMAIL to enable alerts.
              </p>
            </div>

            {/* Scheduled reports */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>
                <Clock size={16} /> Scheduled Reports
              </div>

              <div style={{ padding: "12px 16px", background: "#eff6ff", borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#1d4ed8", fontSize: 14, marginBottom: 4 }}>Daily Report</div>
                <div style={{ color: "#3b82f6", fontSize: 13 }}>Runs automatically every day at 08:00 AM</div>
              </div>

              <div style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>
                <p>The daily report includes:</p>
                <ul style={{ paddingLeft: 16, marginTop: 4 }}>
                  <li>Total activities from the previous day</li>
                  <li>HIGH / MEDIUM / LOW risk breakdown</li>
                  <li>Flagged and blocked activity counts</li>
                  <li>Top 5 risky users</li>
                  <li>Link to the admin dashboard</li>
                </ul>
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 12 }}>
                Reports are sent to all admin users with an email address configured.
                The scheduled job initializes when the backend server starts.
              </p>
            </div>

            {/* Test email */}
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <div className="card-title" style={{ marginBottom: 16 }}>
                <TestTube size={16} /> Send Test Email
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <input
                  type="email"
                  className="input"
                  placeholder="recipient@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleTest}
                  disabled={testing || !testEmail.trim() || !settings?.configured}
                >
                  {testing ? <><div className="spinner spinner-sm" /> Sending…</> : <>Send Test</>}
                </button>
              </div>
              {!settings?.configured && (
                <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
                  Configure email credentials in the .env file before sending test emails.
                </p>
              )}
              {testResult && (
                <div
                  className={`alert ${testResult.success ? "alert-success" : "alert-error"}`}
                  style={{ marginTop: 12 }}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            {/* .env reference */}
            <div className="card" style={{ gridColumn: "1 / -1" }}>
              <div className="card-title" style={{ marginBottom: 12 }}>
                <Save size={16} /> Environment Configuration
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
                Add the following to your <code>backend/.env</code> file:
              </p>
              <pre
                style={{
                  background: "#1e293b",
                  color: "#94a3b8",
                  padding: "16px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  overflowX: "auto",
                  lineHeight: 1.8,
                }}
              >
{`EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
ADMIN_EMAIL=admin@company.com
FRONTEND_URL=http://localhost:5173`}
              </pre>
              <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
                For Gmail, use an App Password (not your regular password).
                Go to Google Account → Security → 2-Step Verification → App Passwords.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
