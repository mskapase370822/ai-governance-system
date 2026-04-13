import riskModel from "../ml/riskModel.js";
import UserActivity from "../models/UserActivity.js";
import { detectRisk } from "../utils/detectRisk.js";
import { computeRiskScore } from "../core/riskEngine/RiskScorer.js";

/**
 * POST /api/ml/train
 * Train the ML model on historical activities (admin only).
 */
export const trainModel = async (req, res) => {
  try {
    const activities = await UserActivity.find()
      .select("inputText riskLevel")
      .limit(2000);

    const result = await riskModel.train(activities, {
      iterations: req.body.iterations || 500,
    });

    res.json({
      message: "Model trained successfully",
      iterations: result.iterations,
      finalError: result.finalError,
      stats: riskModel.getStats(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/ml/predict
 * Predict risk level for a text (authenticated users).
 */
export const predictRisk = async (req, res) => {
  try {
    const { text, userProfile } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }
    const result = riskModel.predict(text.trim(), userProfile || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/ml/stats
 * Get current model statistics.
 */
export const getModelStats = async (req, res) => {
  try {
    res.json(riskModel.getStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/ml/analyze-risk
 * AI-based risk classification using the weighted rule engine.
 * Returns { risk, score, reason, riskDetails }.
 */
export const analyzeRiskEndpoint = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }
    const trimmed = text.trim();

    // Use the comprehensive weighted rule-based scoring engine for accurate results
    const assessment = computeRiskScore(trimmed, { userRole: req.user?.role });

    const riskLabel = assessment.riskLevel.toLowerCase(); // "low" | "medium" | "high"

    // Build a human-readable reason
    let reason;
    if (assessment.triggeredRules.length === 0) {
      reason = "No risk indicators detected — input appears safe.";
    } else {
      const topFactors = assessment.triggeredRules
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 3)
        .map((r) => r.ruleName);
      reason = `Risk indicators found: ${topFactors.join(", ")}. Score: ${assessment.score}/100.`;
    }

    res.json({
      risk: riskLabel,
      score: assessment.score,
      confidence: assessment.confidence,
      reason,
      riskDetails: assessment.riskDetails,
      riskLevel: assessment.riskLevel,
      category: assessment.category,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
