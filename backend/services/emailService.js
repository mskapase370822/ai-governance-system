import nodemailer from "nodemailer";
import { highRiskTemplate, dailySummaryTemplate, approvalTemplate } from "../config/emailTemplates.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.enabled = false;
  }

  /**
   * Lazily create the transporter using environment variables.
   * This avoids crashing on startup if email vars are not set.
   */
  getTransporter() {
    if (this.transporter) return this.transporter;

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const service = process.env.EMAIL_SERVICE || "gmail";

    if (!user || !pass) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
    this.enabled = true;
    return this.transporter;
  }

  /**
   * Send a HIGH-risk alert email to admin(s).
   */
  async sendHighRiskAlert(adminEmails, activityData, riskDetails) {
    const transporter = this.getTransporter();
    if (!transporter) return;

    const recipients = Array.isArray(adminEmails)
      ? adminEmails.join(", ")
      : adminEmails;

    const mailOptions = {
      from: `"AI Governance System" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject: `🚨 HIGH RISK Activity Detected — ${activityData.username || "Unknown User"}`,
      html: highRiskTemplate(activityData, riskDetails),
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 High-risk alert sent to ${recipients}`);
    } catch (err) {
      console.error("EmailService.sendHighRiskAlert error:", err.message);
    }
  }

  /**
   * Send a daily summary email to admin(s).
   */
  async sendDailySummary(adminEmail, stats) {
    const transporter = this.getTransporter();
    if (!transporter) return;

    const mailOptions = {
      from: `"AI Governance System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `📊 Daily Activity Summary — ${new Date().toLocaleDateString()}`,
      html: dailySummaryTemplate(stats),
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Daily summary sent to ${adminEmail}`);
    } catch (err) {
      console.error("EmailService.sendDailySummary error:", err.message);
    }
  }

  /**
   * Send an approval request notification email.
   */
  async sendApprovalRequest(adminEmail, approvalDetails) {
    const transporter = this.getTransporter();
    if (!transporter) return;

    const mailOptions = {
      from: `"AI Governance System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `⚠️ Approval Required — ${approvalDetails.username || "Unknown"}`,
      html: approvalTemplate(approvalDetails),
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📧 Approval request sent to ${adminEmail}`);
    } catch (err) {
      console.error("EmailService.sendApprovalRequest error:", err.message);
    }
  }
}

export default new EmailService();
