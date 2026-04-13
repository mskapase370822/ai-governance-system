/**
 * routes/v1/analytics.js — Versioned analytics endpoints
 *
 * GET /api/v1/analytics/dashboard  — Full dashboard stats (admin)
 * GET /api/v1/analytics/me         — Current user's stats
 * GET /api/v1/analytics/risk-score — Risk score distribution from PromptLog
 */

import express from "express";
import { protect, adminOnly }  from "../../middleware/authMiddleware.js";
import { apiLimiter }          from "../../core/security/RateLimiter.js";
import { getDashboardStats, getUserStats } from "../../controllers/analyticsController.js";
import PromptLog               from "../../models/PromptLog.js";
import Log                     from "../../models/Log.js";

const router = express.Router();

// ── GET /api/v1/analytics/dashboard (admin) ───────────────────────────────────
router.get("/dashboard", protect, adminOnly, apiLimiter, getDashboardStats);

// ── GET /api/v1/analytics/me ──────────────────────────────────────────────────
router.get("/me", protect, apiLimiter, getUserStats);

// GET /api/v1/analytics/risk-score — numeric score distribution
router.get("/risk-score", protect, adminOnly, apiLimiter, async (req, res, next) => {
  try {
    const buckets = await PromptLog.aggregate([
      {
        $bucket: {
          groupBy: "$numericRiskScore",
          boundaries: [0, 11, 21, 31, 41, 51, 61, 71, 81, 91, 101],
          default: "other",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Average risk score over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const trend = await PromptLog.aggregate([
      { $match: { timestamp: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          avgScore: { $avg: "$numericRiskScore" },
          count:    { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top triggered rules
    const topRules = await PromptLog.aggregate([
      { $unwind: "$triggeredRules" },
      { $group: { _id: "$triggeredRules.ruleName", count: { $sum: 1 }, avgContribution: { $avg: "$triggeredRules.contribution" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ scoreBuckets: buckets, scoreTrend: trend, topRules });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/explainability/:logId — explainability for a specific log
router.get("/explainability/:logId", protect, adminOnly, apiLimiter, async (req, res, next) => {
  try {
    const promptLog = await PromptLog.findById(req.params.logId);
    if (!promptLog) {
      // Fallback: check the legacy Log model
      const legacyLog = await Log.findById(req.params.logId).populate("userId", "username role");
      if (!legacyLog) return res.status(404).json({ error: "Log not found." });
      return res.json({ log: legacyLog, explainability: null, message: "Legacy log — no explainability data." });
    }
    res.json({
      log:            promptLog,
      explainability: promptLog.explainability,
      triggeredRules: promptLog.triggeredRules,
      factorScores:   promptLog.factorScores,
      numericScore:   promptLog.numericRiskScore,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
