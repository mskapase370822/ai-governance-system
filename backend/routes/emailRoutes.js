/**
 * Email Settings Routes
 * GET  /api/email/settings  — get current email config (admin only)
 * POST /api/email/test      — send test email (admin only)
 */
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { sendTestEmail } from "../services/emailService.js";

const router = express.Router();

/**
 * GET /api/email/settings
 * Return current email configuration status (no secrets).
 */
router.get("/settings", protect, adminOnly, (req, res) => {
  res.json({
    configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
    service: process.env.EMAIL_SERVICE || "gmail",
    emailUser: process.env.EMAIL_USER
      ? process.env.EMAIL_USER.replace(/(.{2}).*(@.*)/, "$1***$2")
      : null,
    adminEmail: process.env.ADMIN_EMAIL || null,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    features: {
      highRiskAlerts: true,
      dailySummaries: true,
      approvalRequests: true,
    },
  });
});

/**
 * POST /api/email/test
 * Send a test email to the requesting admin's email or ADMIN_EMAIL.
 */
router.post("/test", protect, adminOnly, async (req, res) => {
  try {
    const to = req.body.to || process.env.ADMIN_EMAIL;
    if (!to) {
      return res.status(400).json({ error: "No recipient email address. Set ADMIN_EMAIL in .env or provide 'to' in body." });
    }
    const success = await sendTestEmail(to);
    if (success) {
      res.json({ message: `Test email sent to ${to}` });
    } else {
      res.status(503).json({ error: "Failed to send test email. Check EMAIL_USER / EMAIL_PASSWORD in .env." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
