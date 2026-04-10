import Log from "../models/Log.js";
import User from "../models/User.js";
import Alert from "../models/Alert.js";
import ApprovalRequest from "../models/ApprovalRequest.js";

/**
 * Get dashboard analytics (Admin/Manager)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalLogs = await Log.countDocuments();
    const highRisk = await Log.countDocuments({ riskLevel: "HIGH" });
    const mediumRisk = await Log.countDocuments({ riskLevel: "MEDIUM" });
    const lowRisk = await Log.countDocuments({ riskLevel: "LOW" });
    const blocked = await Log.countDocuments({ status: "blocked" });
    const pendingApprovals = await ApprovalRequest.countDocuments({ status: "pending" });
    const anomalies = await Log.countDocuments({ isAnomaly: true });
    const activeUsers = await User.countDocuments({ isActive: true });
    const unreadAlerts = await Alert.countDocuments({ isRead: false });

    // Risk distribution
    const riskDistribution = [
      { name: "Low Risk", count: lowRisk, color: "#10b981" },
      { name: "Medium Risk", count: mediumRisk, color: "#f59e0b" },
      { name: "High Risk", count: highRisk, color: "#ef4444" },
    ];

    // Status distribution
    const statusCounts = await Log.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Activity per day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyActivity = await Log.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          total: { $sum: 1 },
          high: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ["$riskLevel", "MEDIUM"] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ["$riskLevel", "LOW"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top risky users
    const topRiskyUsers = await Log.aggregate([
      { $match: { riskLevel: { $in: ["HIGH", "MEDIUM"] } } },
      { $group: { _id: "$userId", highRiskCount: { $sum: 1 } } },
      { $sort: { highRiskCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          username: "$user.username",
          role: "$user.role",
          highRiskCount: 1,
        },
      },
    ]);

    // Most frequent risky actions (keyword extraction)
    const recentHighRisk = await Log.find({ riskLevel: "HIGH" })
      .select("action reason category")
      .sort({ timestamp: -1 })
      .limit(50);

    const categoryCounts = await Log.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      summary: {
        totalLogs,
        highRisk,
        mediumRisk,
        lowRisk,
        blocked,
        pendingApprovals,
        anomalies,
        activeUsers,
        unreadAlerts,
      },
      riskDistribution,
      statusCounts,
      dailyActivity,
      topRiskyUsers,
      categoryCounts,
      recentHighRiskActions: recentHighRisk.slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get user-specific stats
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const totalLogs = await Log.countDocuments({ userId });
    const highRisk = await Log.countDocuments({ userId, riskLevel: "HIGH" });
    const mediumRisk = await Log.countDocuments({ userId, riskLevel: "MEDIUM" });
    const lowRisk = await Log.countDocuments({ userId, riskLevel: "LOW" });
    const blocked = await Log.countDocuments({ userId, status: { $in: ["blocked", "denied"] } });
    const pending = await ApprovalRequest.countDocuments({ requestedBy: userId, status: "pending" });

    res.json({
      totalLogs,
      highRisk,
      mediumRisk,
      lowRisk,
      blocked,
      pendingApprovals: pending,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
