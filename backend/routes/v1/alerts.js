/**
 * routes/v1/alerts.js — Versioned alert management endpoints
 *
 * GET  /api/v1/alerts/          — List alerts (admin)
 * PUT  /api/v1/alerts/:id/read  — Mark one alert read
 * PUT  /api/v1/alerts/read-all  — Mark all alerts read
 * PUT  /api/v1/alerts/:id/dismiss — Dismiss an alert
 * GET  /api/v1/alerts/unread-count — Unread alert count
 */

import express from "express";
import { protect, adminOnly }  from "../../middleware/authMiddleware.js";
import * as AlertService       from "../../services/AlertService.js";
import { apiLimiter }          from "../../core/security/RateLimiter.js";

const router = express.Router();
router.use(protect, adminOnly, apiLimiter);

// GET /api/v1/alerts/
router.get("/", async (req, res, next) => {
  try {
    const { type, riskLevel, isRead, page = 1, limit = 20 } = req.query;
    const result = await AlertService.getAlerts({ type, riskLevel, isRead, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/alerts/unread-count
router.get("/unread-count", async (req, res, next) => {
  try {
    const count = await AlertService.countUnread();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/alerts/read-all  (must come before /:id routes)
router.put("/read-all", async (req, res, next) => {
  try {
    const count = await AlertService.markAllRead();
    res.json({ message: `${count} alert(s) marked as read.` });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/alerts/:id/read
router.put("/:id/read", async (req, res, next) => {
  try {
    const alert = await AlertService.markRead(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert not found." });
    res.json(alert);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/alerts/:id/dismiss
router.put("/:id/dismiss", async (req, res, next) => {
  try {
    const alert = await AlertService.dismissAlert(req.params.id);
    if (!alert) return res.status(404).json({ error: "Alert not found." });
    res.json(alert);
  } catch (err) {
    next(err);
  }
});

export default router;
