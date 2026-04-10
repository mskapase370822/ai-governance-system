/**
 * ML Controller
 * POST /api/ml/train   — train model on historical data
 * POST /api/ml/predict — predict risk for new text
 * GET  /api/ml/stats   — model stats
 */
import UserActivity from "../models/UserActivity.js";
import { trainModel, predictRisk, getModelStats } from "../ml/riskModel.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

/**
 * POST /api/ml/train
 * Admin: train model on all existing activities.
 */
export const trainMLModel = async (req, res) => {
  try {
    const activities = await UserActivity.find().populate("userId", "role username");
    if (activities.length === 0) {
      return res.status(400).json({ error: "No activities found to train on." });
    }

    const result = trainModel(activities);
    res.json({
      message: "Model trained successfully",
      ...result,
    });
  } catch (err) {
    console.error("ML train error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/ml/predict
 * Authenticated: predict risk level for given text.
 */
export const predictRiskLevel = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text field is required." });
    }
    const userProfile = { role: req.user?.role, username: req.user?.username };
    const result = predictRisk(text.trim(), userProfile);
    res.json(result);
  } catch (err) {
    console.error("ML predict error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/ml/stats
 * Admin: get model architecture and training status.
 */
export const getMLStats = async (req, res) => {
  try {
    const stats = getModelStats();
    const totalActivities = await UserActivity.countDocuments();
    res.json({ ...stats, totalTrainingSamples: totalActivities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
