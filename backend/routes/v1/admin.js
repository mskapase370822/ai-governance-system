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
router.use(protect, adminOnly, apiLimiter);

// GET /api/v1/admin/users
router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/users/:id/role
router.put("/users/:id/role", async (req, res, next) => {
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
router.get("/audit-logs", async (req, res, next) => {
  try {
    const { actorId, action, entity, startDate, endDate, page = 1, limit = 50 } = req.query;
    const result = await AuditService.getAuditLogs({ actorId, action, entity, startDate, endDate, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/prompt-logs
router.get("/prompt-logs", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, riskLevel, minScore, maxScore } = req.query;
    const query = {};

    if (riskLevel && riskLevel !== "all") query.riskLevel = riskLevel;
    if (minScore !== undefined) query.numericRiskScore = { $gte: Number(minScore) };
    if (maxScore !== undefined) {
      query.numericRiskScore = { ...query.numericRiskScore, $lte: Number(maxScore) };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await PromptLog.countDocuments(query);
    const logs  = await PromptLog
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("userId", "username role");

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/system-stats
router.get("/system-stats", async (req, res, next) => {
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
