/**
 * routes/v1/prompts.js — Versioned prompt submission endpoints
 *
 * POST /api/v1/prompts/submit   — Submit and analyse a prompt
 * PUT  /api/v1/prompts/confirm/:logId — Confirm a warned prompt
 * GET  /api/v1/prompts/         — Get current user's prompt logs
 */

import express from "express";
import { body } from "express-validator";
import { protect }           from "../../middleware/authMiddleware.js";
import { validateRequest }   from "../../middleware/validateRequest.js";
import { submitLimiter, apiLimiter }  from "../../core/security/RateLimiter.js";
import { processPrompt }     from "../../services/PromptService.js";
import Log                   from "../../models/Log.js";

const router = express.Router();

// ── POST /api/v1/prompts/submit ───────────────────────────────────────────────
router.post(
  "/submit",
  protect,
  submitLimiter,
  [
    body("action")
      .isString().withMessage("Prompt must be a string.")
      .trim()
      .notEmpty().withMessage("Prompt is required.")
      .isLength({ max: 5000 }).withMessage("Prompt must not exceed 5000 characters."),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await processPrompt({
        rawPrompt:    req.body.action,
        user:         req.user,
        meta: {
          ipAddress:    req.ip,
          userAgent:    req.headers["user-agent"],
          promptSource: "api",
          confirmed:    req.body.confirmed,
        },
        io: req.app.get("io"),
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /api/v1/prompts/confirm/:logId ────────────────────────────────────────
router.put("/confirm/:logId", protect, apiLimiter, async (req, res, next) => {
  try {
    const log = await Log.findById(req.params.logId);
    if (!log) return res.status(404).json({ error: "Log not found." });
    if (log.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorised." });
    }
    if (log.status !== "warned") {
      return res.status(400).json({ error: "Only warned actions can be confirmed." });
    }

    log.status         = "allowed";
    log.systemResponse = "Input confirmed by user after warning.";
    await log.save();

    const populated = await Log.findById(log._id).populate("userId", "username role");
    res.json({ message: "Input confirmed.", log: populated });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/prompts/ ──────────────────────────────────────────────────────
router.get("/", protect, apiLimiter, async (req, res, next) => {
  try {
    const ALLOWED_RISK_LEVELS = ["all", "LOW", "MEDIUM", "HIGH"];
    const { riskLevel } = req.query;
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const query = { userId: req.user._id };
    if (riskLevel && riskLevel !== "all" && ALLOWED_RISK_LEVELS.includes(riskLevel)) {
      query.riskLevel = riskLevel;
    }

    const skip  = (page - 1) * limit;
    const total = await Log.countDocuments(query);
    const logs  = await Log
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

export default router;
