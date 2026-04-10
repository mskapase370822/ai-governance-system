import Log from "../models/Log.js";

/**
 * Get current user's logs
 */
export const getMyLogs = async (req, res) => {
  try {
    const { riskLevel, status, search, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user._id };

    if (riskLevel && riskLevel !== "all") filter.riskLevel = riskLevel.toUpperCase();
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.action = { $regex: search, $options: "i" };
    }

    const total = await Log.countDocuments(filter);
    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all logs (Admin/Manager only)
 */
export const getAllLogs = async (req, res) => {
  try {
    const { riskLevel, status, search, userId, isAnomaly, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (riskLevel && riskLevel !== "all") filter.riskLevel = riskLevel.toUpperCase();
    if (status && status !== "all") filter.status = status;
    if (userId) filter.userId = userId;
    if (isAnomaly === "true") filter.isAnomaly = true;
    if (search) {
      filter.action = { $regex: search, $options: "i" };
    }

    const total = await Log.countDocuments(filter);
    const logs = await Log.find(filter)
      .populate("userId", "username role department")
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get anomaly logs only (Admin/Manager)
 */
export const getAnomalyLogs = async (req, res) => {
  try {
    const logs = await Log.find({ isAnomaly: true })
      .populate("userId", "username role department")
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
