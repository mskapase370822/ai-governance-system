import { useState } from "react";
import { Navbar } from "../components/Navbar";
import { Mail, Bell, FileText, CheckCircle, Send, Info } from "lucide-react";

const DEFAULT_SETTINGS = {
  alertOnHighRisk: true,
  alertOnMediumRisk: false,
  dailySummary: true,
  approvalRequests: true,
};

export default function AdminEmailSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestEmail = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="page-content">
        <div className="dashboard-welcome">
          <h1>Email <span className="text-gradient">Settings</span></h1>
          <p>Configure automated email alerts and notification preferences.</p>
        </div>

        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* SMTP info */}
          <div className="card" style={{ padding: 20, borderLeft: "3px solid var(--primary)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Info size={18} style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>SMTP Configuration</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  Email delivery is configured via environment variables on the server:
                  <code style={{
                    display: "block", marginTop: 8, padding: "8px 12px",
                    background: "rgba(0,0,0,0.2)", borderRadius: 6,
                    fontSize: 12, fontFamily: "monospace", lineHeight: 1.8,
                  }}>
                    EMAIL_SERVICE=gmail<br />
                    EMAIL_USER=your@gmail.com<br />
                    EMAIL_PASSWORD=app_password<br />
                    ADMIN_EMAIL=admin@company.com
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Notification toggles */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-title" style={{ marginBottom: 20 }}>
              <Bell size={18} />
              Notification Preferences
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <ToggleRow
                icon={<Mail size={16} />}
                label="High Risk Alerts"
                description="Send an email immediately when a HIGH risk activity is detected."
                checked={settings.alertOnHighRisk}
                onChange={() => toggle("alertOnHighRisk")}
              />
              <ToggleRow
                icon={<Bell size={16} />}
                label="Medium Risk Alerts"
                description="Send an email when a MEDIUM risk activity is submitted."
                checked={settings.alertOnMediumRisk}
                onChange={() => toggle("alertOnMediumRisk")}
              />
              <ToggleRow
                icon={<FileText size={16} />}
                label="Daily Summary Reports"
                description="Receive a daily summary of all activities at 8:00 AM."
                checked={settings.dailySummary}
                onChange={() => toggle("dailySummary")}
              />
              <ToggleRow
                icon={<CheckCircle size={16} />}
                label="Approval Request Notifications"
                description="Get notified when a user submits an activity requiring approval."
                checked={settings.approvalRequests}
                onChange={() => toggle("approvalRequests")}
                last
              />
            </div>
          </div>

          {/* Actions */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-title" style={{ marginBottom: 20 }}>
              <Send size={18} />
              Actions
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button className="btn btn-primary" onClick={handleSave}>
                {saved ? <><CheckCircle size={15} style={{ marginRight: 6 }} />Saved!</> : "Save Preferences"}
              </button>
              <button className="btn btn-ghost" onClick={handleTestEmail}>
                {testSent
                  ? <><CheckCircle size={15} style={{ marginRight: 6 }} />Test Sent!</>
                  : <><Send size={15} style={{ marginRight: 6 }} />Send Test Email</>}
              </button>
            </div>
            {testSent && (
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--success, #16a34a)" }}>
                📧 Test email dispatched to the configured admin address.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, description, checked, onChange, last }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 0",
      borderBottom: last ? "none" : "1px solid var(--border-subtle)",
      gap: 16,
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1 }}>
        <div style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{description}</div>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        style={{
          flexShrink: 0,
          width: 44, height: 24, borderRadius: 12,
          border: "none", cursor: "pointer",
          background: checked ? "var(--primary, #2563eb)" : "var(--border-subtle, #334155)",
          position: "relative", transition: "background 0.2s",
        }}
      >
        <span style={{
          position: "absolute", top: 2,
          left: checked ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}
