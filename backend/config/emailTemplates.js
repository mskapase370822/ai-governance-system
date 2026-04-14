/**
 * HTML email templates for the AI Governance System
 */

export const highRiskTemplate = (activityData, riskDetails) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #dc2626; color: #fff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 12px; font-size: 13px; margin-top: 8px; }
    .body { padding: 24px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .value { font-size: 15px; color: #111827; font-weight: 500; }
    .activity-text { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #7f1d1d; margin-top: 4px; }
    .score-bar { background: #fee2e2; border-radius: 4px; height: 8px; margin-top: 6px; }
    .score-fill { background: #dc2626; height: 8px; border-radius: 4px; width: 100%; }
    .footer { background: #f9fafb; padding: 16px 24px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .btn { display: inline-block; background: #dc2626; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 HIGH RISK ACTIVITY DETECTED</h1>
      <span class="badge">Immediate Action Required</span>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">Employee</div>
        <div class="value">${activityData.username || "Unknown"}</div>
      </div>
      <div class="field">
        <div class="label">Activity Submitted</div>
        <div class="activity-text">${activityData.inputText || ""}</div>
      </div>
      <div class="field">
        <div class="label">Risk Level</div>
        <div class="value">🔴 HIGH</div>
      </div>
      <div class="field">
        <div class="label">Risk Reason</div>
        <div class="value">${riskDetails.reason || "High-risk keywords detected"}</div>
      </div>
      <div class="field">
        <div class="label">Status</div>
        <div class="value">🔴 BLOCKED — Awaiting Admin Review</div>
      </div>
      <div class="field">
        <div class="label">Timestamp</div>
        <div class="value">${new Date().toLocaleString()}</div>
      </div>
      <div class="field">
        <div class="label">Recommendation</div>
        <div class="value">Review immediately and decide whether to approve or keep blocked.</div>
      </div>
    </div>
    <div class="footer">
      This is an automated alert from the AI Governance System. Do not reply to this email.
    </div>
  </div>
</body>
</html>
`;

export const dailySummaryTemplate = (stats) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #1e40af; color: #fff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
    .body { padding: 24px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .stat-card { background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-card.red { border-top: 3px solid #dc2626; }
    .stat-card.yellow { border-top: 3px solid #d97706; }
    .stat-card.green { border-top: 3px solid #16a34a; }
    .stat-card.blue { border-top: 3px solid #2563eb; }
    .stat-number { font-size: 28px; font-weight: 700; color: #111827; }
    .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    h2 { font-size: 16px; color: #374151; margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; background: #f3f4f6; color: #6b7280; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
    .footer { background: #f9fafb; padding: 16px 24px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Activity Summary</h1>
      <p>${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
    <div class="body">
      <div class="stats-grid">
        <div class="stat-card blue">
          <div class="stat-number">${stats.total || 0}</div>
          <div class="stat-label">Total Activities</div>
        </div>
        <div class="stat-card red">
          <div class="stat-number">${stats.highRisk || 0}</div>
          <div class="stat-label">High Risk</div>
        </div>
        <div class="stat-card yellow">
          <div class="stat-number">${stats.mediumRisk || 0}</div>
          <div class="stat-label">Medium Risk</div>
        </div>
        <div class="stat-card green">
          <div class="stat-number">${stats.lowRisk || 0}</div>
          <div class="stat-label">Low Risk</div>
        </div>
      </div>

      ${stats.topUsers && stats.topUsers.length > 0 ? `
      <h2>Top Risky Users</h2>
      <table>
        <tr>
          <th>Username</th>
          <th>High Risk</th>
          <th>Total</th>
        </tr>
        ${stats.topUsers.map(u => `
        <tr>
          <td>${u.username}</td>
          <td>${u.highRisk}</td>
          <td>${u.total}</td>
        </tr>
        `).join("")}
      </table>
      ` : ""}
    </div>
    <div class="footer">
      Automated daily summary from the AI Governance System — ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
`;

export const approvalTemplate = (approvalDetails) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #d97706; color: #fff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 24px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .value { font-size: 15px; color: #111827; font-weight: 500; }
    .activity-text { background: #fffbeb; border-left: 4px solid #d97706; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #78350f; margin-top: 4px; }
    .footer { background: #f9fafb; padding: 16px 24px; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ APPROVAL REQUEST</h1>
    </div>
    <div class="body">
      <div class="field">
        <div class="label">Requested By</div>
        <div class="value">${approvalDetails.username || "Unknown"}</div>
      </div>
      <div class="field">
        <div class="label">Activity</div>
        <div class="activity-text">${approvalDetails.action || ""}</div>
      </div>
      <div class="field">
        <div class="label">Risk Level</div>
        <div class="value">🟡 ${approvalDetails.riskLevel || "MEDIUM"}</div>
      </div>
      <div class="field">
        <div class="label">Submitted At</div>
        <div class="value">${new Date().toLocaleString()}</div>
      </div>
    </div>
    <div class="footer">
      Please log in to the Admin Dashboard to approve or deny this request.
    </div>
  </div>
</body>
</html>
`;
