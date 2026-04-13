/**
 * Action Controller — The central action processing pipeline
 *
 * Pipeline: PromptValidator → RiskScorer (weighted 0-100) → ExplainabilityEngine →
 *           Policy Engine → RBAC → Anomaly Detection → Log & Alert
 *
 * Delegates to PromptService for full processing.
 * This controller stays thin — it handles HTTP I/O only.
 */
import Log from "../models/Log.js";
import { processPrompt } from "../services/PromptService.js";

/**
 * Main action submission handler — delegates to PromptService
 */
export const submitAction = async (req, res) => {
  try {
    const result = await processPrompt({
      rawPrompt: req.body?.action,
      user:      req.user,
      meta: {
        ipAddress:    req.ip,
        userAgent:    req.headers["user-agent"],
        promptSource: "ui",
        confirmed:    req.body?.confirmed,
      },
      io: req.app.get("io"),
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Action submission error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Employee confirms a warned action
 */
export const confirmAction = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await Log.findById(logId);

    if (!log) return res.status(404).json({ error: "Log not found" });
    if (log.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (log.status !== "warned") {
      return res.status(400).json({ error: "This action cannot be confirmed" });
    }

    log.status = "allowed";
    log.systemResponse = "Input confirmed by user after warning.";
    await log.save();

    const populated = await Log.findById(log._id).populate("userId", "username role");
    res.json({ message: "Input confirmed", log: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

