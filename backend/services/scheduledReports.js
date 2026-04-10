/**
 * Scheduled Reports Service
 * Uses node-cron to send daily summary emails to all admin users.
 */
import cron from "node-cron";
import User from "../models/User.js";
import UserActivity from "../models/UserActivity.js";
import { sendDailySummary } from "./emailService.js";

/**
 * Gather yesterday's activity statistics.
 */
async function generateDailySummary() {
  const now = new Date();
  const startOfYesterday = new Date(now);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(startOfYesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const dateFilter = { timestamp: { $gte: startOfYesterday, $lte: endOfYesterday } };

  const [total, highRisk, mediumRisk, lowRisk, flagged, blocked, approved] = await Promise.all([
    UserActivity.countDocuments(dateFilter),
    UserActivity.countDocuments({ ...dateFilter, riskLevel: "HIGH" }),
    UserActivity.countDocuments({ ...dateFilter, riskLevel: "MEDIUM" }),
    UserActivity.countDocuments({ ...dateFilter, riskLevel: "LOW" }),
    UserActivity.countDocuments({ ...dateFilter, status: "FLAGGED" }),
    UserActivity.countDocuments({ ...dateFilter, status: "BLOCKED" }),
    UserActivity.countDocuments({ ...dateFilter, status: "APPROVED" }),
  ]);

  // Top risky users (most HIGH-risk activities yesterday)
  const topRiskyAgg = await UserActivity.aggregate([
    { $match: { ...dateFilter, riskLevel: "HIGH" } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
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
        count: 1,
      },
    },
  ]);

  return {
    stats: { total, highRisk, mediumRisk, lowRisk, flagged, blocked, approved },
    topRiskyUsers: topRiskyAgg.map((u) => ({ username: u.username, count: u.count })),
  };
}

/**
 * Send daily report email to all admin users.
 */
async function sendDailyReportEmail() {
  try {
    const admins = await User.find({ role: "Admin" }).select("email username");
    if (!admins.length) {
      console.log("📧 No admin users found — skipping daily report");
      return;
    }

    const { stats, topRiskyUsers } = await generateDailySummary();

    for (const admin of admins) {
      const email = admin.email || process.env.ADMIN_EMAIL;
      if (!email) {
        console.warn(`⚠️  Admin ${admin.username} has no email address — skipped`);
        continue;
      }
      await sendDailySummary(email, stats, topRiskyUsers);
    }

    console.log(
      `📊 Daily report sent to ${admins.length} admin(s) — ` +
      `Total: ${stats.total}, HIGH: ${stats.highRisk}, MEDIUM: ${stats.mediumRisk}, LOW: ${stats.lowRisk}`
    );
  } catch (err) {
    console.error("❌ Failed to send daily report:", err.message);
  }
}

/**
 * Initialize scheduled jobs.
 * Daily report: runs every day at 08:00 AM server time.
 */
export function initializeScheduledReports() {
  // Every day at 08:00
  cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Running scheduled daily report...");
    await sendDailyReportEmail();
  });

  console.log("✅ Scheduled reports initialized (daily at 08:00)");
}

export { generateDailySummary, sendDailyReportEmail };
