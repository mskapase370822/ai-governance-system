/**
 * HTML email templates for AI Governance System notifications.
 */

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f4f6f9;
  margin: 0;
  padding: 0;
`;

const cardStyle = `
  background: #ffffff;
  border-radius: 10px;
  padding: 32px;
  max-width: 600px;
  margin: 32px auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
`;

const headerStyle = (color) => `
  background: ${color};
  border-radius: 8px 8px 0 0;
  padding: 24px 32px;
  text-align: center;
`;

const badgeStyle = (bg) => `
  display: inline-block;
  background: ${bg};
  color: #fff;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
`;

const footerHtml = `
  <div style="text-align:center;padding:20px 0 8px;color:#9ca3af;font-size:12px;">
    <p>AI Governance System &mdash; Confidential</p>
    <p>This email was automatically generated. Do not reply directly.</p>
  </div>
`;

/**
 * HIGH RISK alert email template
 */
export const highRiskAlertTemplate = ({ username, role, inputText, riskLevel, confidence, reason, timestamp, activityId }) => ({
  subject: `🚨 HIGH RISK Activity Detected — ${username}`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${baseStyles}">
  <div style="${cardStyle}">
    <div style="${headerStyle("#dc2626")}">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">⚠️ HIGH RISK Alert</h1>
      <p style="color:#fca5a5;margin:8px 0 0;font-size:14px;">Immediate attention required</p>
    </div>
    <div style="padding:0 0 16px;">
      <p style="color:#374151;margin:24px 0 8px;font-size:15px;">A <strong>HIGH RISK</strong> activity was detected in the AI Governance System.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr style="background:#fef2f2;">
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;width:140px;font-weight:600;">User</td>
          <td style="padding:10px 14px;color:#111827;font-size:14px;font-weight:700;">${username} <span style="color:#9ca3af;font-weight:400;">(${role})</span></td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Risk Level</td>
          <td style="padding:10px 14px;"><span style="${badgeStyle("#dc2626")}">${riskLevel}</span></td>
        </tr>
        <tr style="background:#fef2f2;">
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Confidence</td>
          <td style="padding:10px 14px;color:#111827;font-size:14px;">${Math.round((confidence || 0) * 100)}%</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Reason</td>
          <td style="padding:10px 14px;color:#111827;font-size:14px;">${reason || "N/A"}</td>
        </tr>
        <tr style="background:#fef2f2;">
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Timestamp</td>
          <td style="padding:10px 14px;color:#111827;font-size:14px;">${new Date(timestamp).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Activity ID</td>
          <td style="padding:10px 14px;color:#6b7280;font-size:12px;font-family:monospace;">${activityId}</td>
        </tr>
      </table>
      <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:4px;padding:14px 16px;margin:20px 0;">
        <p style="margin:0 0 6px;color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;">Activity Text</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">${inputText}</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <p style="color:#374151;font-size:14px;margin-bottom:16px;">Review this activity in the admin dashboard:</p>
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/activities" 
           style="background:#dc2626;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
          View in Dashboard →
        </a>
      </div>
    </div>
    ${footerHtml}
  </div>
</body>
</html>`,
});

/**
 * Daily summary email template
 */
export const dailySummaryTemplate = ({ date, stats, topRiskyUsers }) => ({
  subject: `📊 Daily AI Governance Summary — ${date}`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${baseStyles}">
  <div style="${cardStyle}">
    <div style="${headerStyle("#1d4ed8")}">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">📊 Daily Summary</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">${date}</p>
    </div>
    <div style="padding:0 0 16px;">
      <p style="color:#374151;margin:24px 0 16px;font-size:15px;">Here is your daily activity summary for the AI Governance System.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0;">
        <div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#16a34a;">${stats.lowRisk || 0}</div>
          <div style="font-size:12px;color:#15803d;font-weight:600;margin-top:4px;">LOW RISK</div>
        </div>
        <div style="background:#fffbeb;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#d97706;">${stats.mediumRisk || 0}</div>
          <div style="font-size:12px;color:#b45309;font-weight:600;margin-top:4px;">MEDIUM RISK</div>
        </div>
        <div style="background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:#dc2626;">${stats.highRisk || 0}</div>
          <div style="font-size:12px;color:#b91c1c;font-weight:600;margin-top:4px;">HIGH RISK</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr style="background:#f9fafb;">
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Total Activities</td>
          <td style="padding:10px 14px;color:#111827;font-size:14px;font-weight:700;">${stats.total || 0}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Flagged</td>
          <td style="padding:10px 14px;color:#d97706;font-size:14px;font-weight:700;">${stats.flagged || 0}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Blocked</td>
          <td style="padding:10px 14px;color:#dc2626;font-size:14px;font-weight:700;">${stats.blocked || 0}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Approved</td>
          <td style="padding:10px 14px;color:#16a34a;font-size:14px;font-weight:700;">${stats.approved || 0}</td>
        </tr>
      </table>
      ${topRiskyUsers && topRiskyUsers.length > 0 ? `
      <div style="margin-top:24px;">
        <h3 style="color:#374151;font-size:15px;font-weight:700;margin-bottom:12px;">Top Risky Users</h3>
        ${topRiskyUsers.map((u, i) => `
          <div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid #f3f4f6;">
            <span style="color:#9ca3af;font-size:12px;width:24px;">${i + 1}.</span>
            <span style="color:#374151;font-size:14px;font-weight:600;">${u.username}</span>
            <span style="margin-left:auto;"><span style="${badgeStyle("#dc2626")}">${u.count} HIGH</span></span>
          </div>`).join("")}
      </div>` : ""}
      <div style="text-align:center;margin-top:28px;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/admin/activities"
           style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
          Open Dashboard →
        </a>
      </div>
    </div>
    ${footerHtml}
  </div>
</body>
</html>`,
});

/**
 * Approval request email template
 */
export const approvalRequestTemplate = ({ requestedBy, action, riskLevel, reason, requestId }) => ({
  subject: `🔔 Approval Required — ${requestedBy} requests action`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${baseStyles}">
  <div style="${cardStyle}">
    <div style="${headerStyle("#7c3aed")}">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">🔔 Approval Request</h1>
      <p style="color:#ddd6fe;margin:8px 0 0;font-size:14px;">Action requires your review</p>
    </div>
    <div style="padding:0 0 16px;">
      <p style="color:#374151;margin:24px 0 16px;font-size:15px;">A new approval request requires your attention.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr style="background:#f9fafb;">
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Requested By</td>
          <td style="padding:10px 14px;color:#111827;font-size:14px;font-weight:700;">${requestedBy}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Risk Level</td>
          <td style="padding:10px 14px;"><span style="${badgeStyle(riskLevel === "HIGH" ? "#dc2626" : riskLevel === "MEDIUM" ? "#d97706" : "#16a34a")}">${riskLevel}</span></td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Reason</td>
          <td style="padding:10px 14px;color:#374151;font-size:14px;">${reason || "No reason provided"}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;color:#6b7280;font-size:13px;font-weight:600;">Request ID</td>
          <td style="padding:10px 14px;color:#9ca3af;font-size:12px;font-family:monospace;">${requestId}</td>
        </tr>
      </table>
      <div style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:4px;padding:14px 16px;margin:20px 0;">
        <p style="margin:0 0 6px;color:#5b21b6;font-size:12px;font-weight:700;text-transform:uppercase;">Action</p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;">${action}</p>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/admin"
           style="background:#7c3aed;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
          Review Request →
        </a>
      </div>
    </div>
    ${footerHtml}
  </div>
</body>
</html>`,
});
