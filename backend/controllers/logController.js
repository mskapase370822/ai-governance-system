import Log from "../models/Log.js";
import User from "../models/User.js";

const buildSearchFilter = async (search, includeUsers = false) => {
  if (!search) {
    return null;
  }

  const regex = new RegExp(search, "i");
  const conditions = [
    { action: regex },
    { reason: regex },
    { systemResponse: regex },
    { category: regex },
  ];

  if (includeUsers) {
    const matchingUsers = await User.find({ username: regex }).select("_id");
    if (matchingUsers.length > 0) {
      conditions.push({ userId: { $in: matchingUsers.map((user) => user._id) } });
    }
  }

  return { $or: conditions };
};

/**
 * Get current user's logs
 */
export const getMyLogs = async (req, res) => {
  try {
    const { riskLevel, status, search, page = 1, limit = 50 } = req.query;
    const filter = { userId: req.user._id };

    if (riskLevel && riskLevel !== "all") filter.riskLevel = riskLevel.toUpperCase();
    if (status && status !== "all") filter.status = status;
    const searchFilter = await buildSearchFilter(search);
    if (searchFilter) {
      Object.assign(filter, searchFilter);
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
    const searchFilter = await buildSearchFilter(search, true);
    if (searchFilter) {
      Object.assign(filter, searchFilter);
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
