/**
 * Email Service — sends transactional emails using nodemailer.
 * Configured via .env: EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD, ADMIN_EMAIL
 */
import nodemailer from "nodemailer";
import {
  highRiskAlertTemplate,
  dailySummaryTemplate,
  approvalRequestTemplate,
} from "../config/emailTemplates.js";

/** Build the transporter once (lazy-init on first use). */
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  const service = process.env.EMAIL_SERVICE || "gmail";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    console.warn("⚠️  Email service not configured — EMAIL_USER / EMAIL_PASSWORD missing in .env");
    return null;
  }

  _transporter = nodemailer.createTransport({
    service,
    auth: { user, pass },
  });
  return _transporter;
}

/**
 * Internal helper — sends a single email.
 * @returns {Promise<boolean>} true on success, false on failure
 */
async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const from = `"AI Governance System" <${process.env.EMAIL_USER}>`;
  try {
    await transporter.sendMail({ from, to, subject, html });
    console.log(`📧 Email sent → ${to} | ${subject}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
    return false;
  }
}

/**
 * Send a HIGH RISK alert to the admin(s).
 * @param {object} user       - { username, role }
 * @param {object} activity   - { _id, inputText, timestamp }
 * @param {object} riskDetails - { riskLevel, confidence, reason }
 */
export async function sendHighRiskAlert(user, activity, riskDetails) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("⚠️  ADMIN_EMAIL not set — skipping high-risk email alert");
    return false;
  }

  const { subject, html } = highRiskAlertTemplate({
    username: user.username,
    role: user.role,
    inputText: activity.inputText,
    riskLevel: riskDetails.riskLevel,
    confidence: riskDetails.confidence,
    reason: riskDetails.reason,
    timestamp: activity.timestamp || new Date(),
    activityId: activity._id,
  });

  return sendMail({ to: adminEmail, subject, html });
}

/**
 * Send a daily summary email.
 * @param {string} adminEmail
 * @param {object} stats - { total, highRisk, mediumRisk, lowRisk, flagged, blocked, approved }
 * @param {Array}  topRiskyUsers - [{ username, count }]
 */
export async function sendDailySummary(adminEmail, stats, topRiskyUsers = []) {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { subject, html } = dailySummaryTemplate({ date, stats, topRiskyUsers });
  return sendMail({ to: adminEmail, subject, html });
}

/**
 * Send an approval request email.
 * @param {string} adminEmail
 * @param {object} requestDetails - { requestedBy, action, riskLevel, reason, requestId }
 */
export async function sendApprovalRequest(adminEmail, requestDetails) {
  const { subject, html } = approvalRequestTemplate(requestDetails);
  return sendMail({ to: adminEmail, subject, html });
}

/**
 * Send a test email to verify configuration.
 */
export async function sendTestEmail(to) {
  return sendMail({
    to,
    subject: "✅ AI Governance System — Email Test",
    html: `<div style="font-family:sans-serif;padding:32px;max-width:480px;margin:auto;background:#f9fafb;border-radius:10px;">
      <h2 style="color:#1d4ed8;">Email Configuration Test</h2>
      <p style="color:#374151;">Your email settings are configured correctly. You will receive alerts from the AI Governance System.</p>
      <p style="color:#9ca3af;font-size:13px;">Sent at: ${new Date().toLocaleString()}</p>
    </div>`,
  });
}
