import UserActivity from "../models/UserActivity.js";
import { analyzeRisk } from "../utils/riskAnalyzer.js";
import emailService from "../services/emailService.js";
import User from "../models/User.js";

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

    // Send email alert on HIGH risk
    if (riskLevel === "HIGH" && process.env.EMAIL_USER) {
      try {
        const admins = await User.find({ role: { $in: ["Admin", "admin"] } }).select("email username");
        const adminEmails = admins.map(a => a.email).filter(Boolean);
        if (adminEmails.length === 0 && process.env.ADMIN_EMAIL) {
          adminEmails.push(process.env.ADMIN_EMAIL);
        }
        if (adminEmails.length > 0) {
          await emailService.sendHighRiskAlert(adminEmails, {
            username: req.user.username,
            inputText: trimmed,
          }, { confidence, reason });
        }
      } catch (emailErr) {
        console.error("Failed to send high-risk email alert:", emailErr.message);
      }
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
 * GET /api/activity/stats/charts
 * Admin: chart-ready data (trend, distribution, top users, heatmap).
 * Query: ?days=30
 */
export const getChartStats = async (req, res) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily breakdown
    const dailyRaw = await UserActivity.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          HIGH:   { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] },   1, 0] } },
          MEDIUM: { $sum: { $cond: [{ $eq: ["$riskLevel", "MEDIUM"] }, 1, 0] } },
          LOW:    { $sum: { $cond: [{ $eq: ["$riskLevel", "LOW"] },    1, 0] } },
          total:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyMap = Object.fromEntries(dailyRaw.map((d) => [d._id, d]));
    const trend = [];
    const heatmap = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      const e = dailyMap[key] || { HIGH: 0, MEDIUM: 0, LOW: 0, total: 0 };
      trend.push({ date: label, HIGH: e.HIGH, MEDIUM: e.MEDIUM, LOW: e.LOW });
      heatmap.push({ date: key, count: e.total, highRisk: e.HIGH });
    }

    // Risk distribution totals
    const [highCount, mediumCount, lowCount] = await Promise.all([
      UserActivity.countDocuments({ riskLevel: "HIGH" }),
      UserActivity.countDocuments({ riskLevel: "MEDIUM" }),
      UserActivity.countDocuments({ riskLevel: "LOW" }),
    ]);
    const distribution = [
      { name: "HIGH",   value: highCount },
      { name: "MEDIUM", value: mediumCount },
      { name: "LOW",    value: lowCount },
    ];

    // Top users by activity count
    const topUsers = await UserActivity.aggregate([
      {
        $group: {
          _id: "$userId",
          count:      { $sum: 1 },
          highRisk:   { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] },   1, 0] } },
          mediumRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "MEDIUM"] }, 1, 0] } },
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
          username:   { $ifNull: ["$user.username", "Unknown"] },
          count:      1,
          highRisk:   1,
          mediumRisk: 1,
        },
      },
    ]);

    res.json({ trend, distribution, topUsers, heatmap });
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
