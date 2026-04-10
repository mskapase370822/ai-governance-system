import UserActivity from "../models/UserActivity.js";
import { analyzeRisk } from "../utils/riskAnalyzer.js";
import { sendHighRiskAlert } from "../services/emailService.js";

/**
 * POST /api/activity/submit
 * User submits free text — ML analyses risk, result saved to DB.
 */
export const submitActivity = async (req, res) => {
  try {
    const { inputText } = req.body;
    const trimmed = typeof inputText === "string" ? inputText.trim() : "";

    if (!trimmed) {
      return res.status(400).json({ error: "Input text is required." });
    }
    if (trimmed.length < 3) {
      return res.status(400).json({ error: "Input text must be at least 3 characters." });
    }
    if (trimmed.length > 1000) {
      return res.status(400).json({ error: "Input text must not exceed 1000 characters." });
    }

    // Analyze risk via ML service (with rule-based fallback)
    const { riskLevel, confidence, reason } = await analyzeRisk(trimmed);

    // Automatically block HIGH-risk submissions
    const isBlocked = riskLevel === "HIGH";
    const status = isBlocked ? "BLOCKED" : "PENDING";

    const activity = await UserActivity.create({
      userId: req.user._id,
      inputText: trimmed,
      riskLevel,
      confidence,
      reason,
      aiAnalysis: reason,
      isBlocked,
      status,
    });

    const populated = await UserActivity.findById(activity._id).populate("userId", "username role");

    // Emit real-time event for admin monitoring
    const io = req.app.get("io");
    if (io && (riskLevel === "HIGH" || riskLevel === "MEDIUM")) {
      io.emit("activity_alert", {
        id: activity._id,
        user: req.user.username,
        riskLevel,
        confidence,
        reason,
        status,
        timestamp: activity.timestamp,
      });
    }

    // Send email alert for HIGH risk activities (non-blocking)
    if (riskLevel === "HIGH") {
      sendHighRiskAlert(
        { username: req.user.username, role: req.user.role },
        { _id: activity._id, inputText: trimmed, timestamp: activity.timestamp },
        { riskLevel, confidence, reason }
      ).catch((err) => console.error("Email alert error:", err.message));
    }

    res.status(201).json({
      activity: populated,
      riskAnalysis: { riskLevel, confidence, reason },
    });
  } catch (err) {
    console.error("submitActivity error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/activity/me
 * Get the authenticated user's own activities with pagination.
 */
export const getMyActivities = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };

    const [activities, total] = await Promise.all([
      UserActivity.find(query)
        .populate("userId", "username role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      UserActivity.countDocuments(query),
    ]);

    res.json({
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/activity/all
 * Admin: get all activities with pagination.
 */
export const getAllActivities = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      UserActivity.find()
        .populate("userId", "username role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      UserActivity.countDocuments(),
    ]);

    res.json({
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/activity/:id
 * Admin: get a single activity by ID.
 */
export const getActivityById = async (req, res) => {
  try {
    const activity = await UserActivity.findById(req.params.id).populate("userId", "username role");
    if (!activity) return res.status(404).json({ error: "Activity not found." });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/activity/:id/flag
 * Admin: flag an activity with a reason.
 */
export const flagActivity = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "A reason is required to flag an activity." });
    }

    const activity = await UserActivity.findByIdAndUpdate(
      req.params.id,
      { status: "FLAGGED", reason: reason.trim() },
      { new: true }
    ).populate("userId", "username role");

    if (!activity) return res.status(404).json({ error: "Activity not found." });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/activity/:id/approve
 * Admin: approve an activity.
 */
export const approveActivity = async (req, res) => {
  try {
    const activity = await UserActivity.findByIdAndUpdate(
      req.params.id,
      { status: "APPROVED", isBlocked: false },
      { new: true }
    ).populate("userId", "username role");

    if (!activity) return res.status(404).json({ error: "Activity not found." });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/activity/:id/block
 * Admin: block a HIGH-risk activity.
 */
export const blockActivity = async (req, res) => {
  try {
    const activity = await UserActivity.findByIdAndUpdate(
      req.params.id,
      { status: "BLOCKED", isBlocked: true },
      { new: true }
    ).populate("userId", "username role");

    if (!activity) return res.status(404).json({ error: "Activity not found." });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/activity/filter
 * Admin: filter activities by riskLevel, status, userId, and/or date range.
 */
export const getFilteredActivities = async (req, res) => {
  try {
    const { riskLevel, status, userId, startDate, endDate, search, page: rawPage, limit: rawLimit } = req.query;

    const page = Math.max(1, parseInt(rawPage) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(rawLimit) || 20));
    const skip = (page - 1) * limit;

    const query = {};
    if (riskLevel && riskLevel !== "all") query.riskLevel = riskLevel.toUpperCase();
    if (status && status !== "all") query.status = status.toUpperCase();
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;
      if ((from && isNaN(from.getTime())) || (to && isNaN(to.getTime()))) {
        return res.status(400).json({ error: "Invalid date format for startDate or endDate." });
      }
      query.timestamp = {};
      if (from) query.timestamp.$gte = from;
      if (to) query.timestamp.$lte = to;
    }
    if (search) {
      query.inputText = { $regex: search, $options: "i" };
    }

    const [activities, total] = await Promise.all([
      UserActivity.find(query)
        .populate("userId", "username role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      UserActivity.countDocuments(query),
    ]);

    res.json({
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/activity/stats/dashboard
 * Admin: get risk statistics for the dashboard.
 */
export const getStatistics = async (req, res) => {
  try {
    const [total, highRisk, mediumRisk, lowRisk, flagged, blocked, approved] = await Promise.all([
      UserActivity.countDocuments(),
      UserActivity.countDocuments({ riskLevel: "HIGH" }),
      UserActivity.countDocuments({ riskLevel: "MEDIUM" }),
      UserActivity.countDocuments({ riskLevel: "LOW" }),
      UserActivity.countDocuments({ status: "FLAGGED" }),
      UserActivity.countDocuments({ status: "BLOCKED" }),
      UserActivity.countDocuments({ status: "APPROVED" }),
    ]);

    res.json({ total, highRisk, mediumRisk, lowRisk, flagged, blocked, approved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/activity/charts/trend
 * Admin: get risk counts grouped by day for last N days (default 30).
 */
export const getRiskTrend = async (req, res) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const data = await UserActivity.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          HIGH: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } },
          MEDIUM: { $sum: { $cond: [{ $eq: ["$riskLevel", "MEDIUM"] }, 1, 0] } },
          LOW: { $sum: { $cond: [{ $eq: ["$riskLevel", "LOW"] }, 1, 0] } },
          total: { $sum: 1 },
          high: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $addFields: { date: "$_id" } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/activity/charts/users
 * Admin: get top users by activity count.
 */
export const getTopUsers = async (req, res) => {
  try {
    const data = await UserActivity.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          highRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmpty: true } },
      {
        $project: {
          username: { $ifNull: ["$user.username", "Unknown"] },
          role: { $ifNull: ["$user.role", "Unknown"] },
          count: 1,
          highRisk: 1,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
