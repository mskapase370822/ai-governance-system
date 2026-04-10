import riskModel from "../ml/riskModel.js";
import UserActivity from "../models/UserActivity.js";
import { detectRisk } from "../utils/detectRisk.js";

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
 * AI-based risk classification. Returns { risk, score, reason }.
 */
export const analyzeRiskEndpoint = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }
    const trimmed = text.trim();

    // Run the JS neural-network model
    const prediction = riskModel.predict(trimmed);

    // Run rule-based engine to get a human-readable reason
    const ruleResult = detectRisk(trimmed);

    // Take the higher risk level
    const riskOrder = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    const finalRiskLevel =
      riskOrder[prediction.riskLevel] >= riskOrder[ruleResult.riskLevel]
        ? prediction.riskLevel
        : ruleResult.riskLevel;

    const finalScore = parseFloat(
      Math.max(prediction.confidence, ruleResult.confidence).toFixed(2)
    );

    const finalReason =
      ruleResult.reason !== "Action appears safe — no risk indicators found."
        ? ruleResult.reason
        : `ML model detected ${prediction.riskLevel.toLowerCase()} risk pattern.`;

    res.json({
      risk: finalRiskLevel.toLowerCase(),
      score: finalScore,
      reason: finalReason,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
