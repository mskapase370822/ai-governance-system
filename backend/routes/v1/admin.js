/**
 * routes/v1/admin.js — Admin-only management endpoints
 *
 * GET  /api/v1/admin/users              — List all users
 * PUT  /api/v1/admin/users/:id/role     — Change a user's role
 * GET  /api/v1/admin/audit-logs         — Paginated audit logs
 * GET  /api/v1/admin/prompt-logs        — PromptLog with explainability
 * GET  /api/v1/admin/system-stats       — Aggregate system health stats
 */

import express from "express";
import { protect, adminOnly }  from "../../middleware/authMiddleware.js";
import { apiLimiter }          from "../../core/security/RateLimiter.js";
import { writeAuditLog }       from "../../services/AuditService.js";
import * as AuditService       from "../../services/AuditService.js";
import User                    from "../../models/User.js";
import PromptLog               from "../../models/PromptLog.js";
import Log                     from "../../models/Log.js";
import Alert                   from "../../models/Alert.js";

const router = express.Router();

// ── GET /api/v1/admin/users ───────────────────────────────────────────────────
router.get("/users", protect, adminOnly, apiLimiter, async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/users/:id/role
router.put("/users/:id/role", protect, adminOnly, apiLimiter, async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowed  = ["admin", "employee", "manager"];
    if (!allowed.includes((role || "").toLowerCase())) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${allowed.join(", ")}` });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    await writeAuditLog(req.user, "UPDATE_USER_ROLE", "User", user._id, { newRole: role }, req.ip);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/audit-logs
router.get("/audit-logs", protect, adminOnly, apiLimiter, async (req, res, next) => {
  try {
    const { actorId, action, entity, startDate, endDate } = req.query;
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const result = await AuditService.getAuditLogs({ actorId, action, entity, startDate, endDate, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/prompt-logs
router.get("/prompt-logs", protect, adminOnly, apiLimiter, async (req, res, next) => {
  try {
    const ALLOWED_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"];
    const riskLevel = ALLOWED_RISK_LEVELS.includes(req.query.riskLevel) ? req.query.riskLevel : undefined;
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const minScore = req.query.minScore !== undefined ? Math.max(0, Math.min(100, Number(req.query.minScore))) : undefined;
    const maxScore = req.query.maxScore !== undefined ? Math.max(0, Math.min(100, Number(req.query.maxScore))) : undefined;

    const query = {};
    if (riskLevel) query.riskLevel = riskLevel;
    if (minScore !== undefined && !isNaN(minScore)) query.numericRiskScore = { $gte: minScore };
    if (maxScore !== undefined && !isNaN(maxScore)) {
      query.numericRiskScore = { ...query.numericRiskScore, $lte: maxScore };
    }

    const skip  = (page - 1) * limit;
    const total = await PromptLog.countDocuments(query);
    const logs  = await PromptLog
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "username role");

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/system-stats
router.get("/system-stats", protect, adminOnly, apiLimiter, async (req, res, next) => {
  try {
    const [totalLogs, totalAlerts, unreadAlerts, blockedActions, avgScoreResult] = await Promise.all([
      Log.countDocuments(),
      Alert.countDocuments(),
      Alert.countDocuments({ isRead: false }),
      Log.countDocuments({ status: "blocked" }),
      PromptLog.aggregate([{ $group: { _id: null, avg: { $avg: "$numericRiskScore" } } }]),
    ]);

    res.json({
      totalLogs,
      totalAlerts,
      unreadAlerts,
      blockedActions,
      averageRiskScore: avgScoreResult[0]?.avg?.toFixed(1) ?? "0.0",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
