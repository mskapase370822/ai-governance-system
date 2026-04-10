import cron from "node-cron";
import emailService from "./emailService.js";
import UserActivity from "../models/UserActivity.js";
import User from "../models/User.js";

class ScheduledReports {
  startScheduler() {
    // Run every day at 8 AM server time
    cron.schedule("0 8 * * *", async () => {
      console.log("📅 Running scheduled daily report...");
      await this.sendDailyReport();
    });

    console.log("⏰ Scheduled reports initialized (daily at 08:00)");
  }

  async sendDailyReport() {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const activities = await UserActivity.find({
        timestamp: { $gte: yesterday, $lt: now },
      });

      const stats = {
        total: activities.length,
        highRisk: activities.filter((a) => a.riskLevel === "HIGH").length,
        mediumRisk: activities.filter((a) => a.riskLevel === "MEDIUM").length,
        lowRisk: activities.filter((a) => a.riskLevel === "LOW").length,
        flagged: activities.filter((a) => a.status === "FLAGGED").length,
        blocked: activities.filter((a) => a.isBlocked).length,
        topUsers: await this.getTopRiskyUsers(yesterday, now),
      };

      const admins = await User.find({ role: { $in: ["Admin", "admin"] } }).select("email username");

      let sentCount = 0;
      for (const admin of admins) {
        if (admin.email) {
          await emailService.sendDailySummary(admin.email, stats);
          sentCount++;
        }
      }

      // Fallback to ADMIN_EMAIL env var
      if (sentCount === 0 && process.env.ADMIN_EMAIL) {
        await emailService.sendDailySummary(process.env.ADMIN_EMAIL, stats);
        sentCount++;
      }

      console.log(`✅ Daily report sent to ${sentCount} admin(s)`);
    } catch (err) {
      console.error("ScheduledReports.sendDailyReport error:", err.message);
    }
  }

  async getTopRiskyUsers(startDate, endDate) {
    try {
      const pipeline = [
        { $match: { timestamp: { $gte: startDate, $lt: endDate } } },
        {
          $group: {
            _id: "$userId",
            total: { $sum: 1 },
            highRisk: {
              $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] },
            },
          },
        },
        { $sort: { highRisk: -1, total: -1 } },
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
            username: "$user.username",
            total: 1,
            highRisk: 1,
          },
        },
      ];

      return await UserActivity.aggregate(pipeline);
    } catch (err) {
      console.error("getTopRiskyUsers error:", err.message);
      return [];
    }
  }
}

export default new ScheduledReports();
