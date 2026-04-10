import riskModel from "../ml/riskModel.js";
import UserActivity from "../models/UserActivity.js";

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
