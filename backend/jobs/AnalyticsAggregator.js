/**
 * jobs/AnalyticsAggregator.js — Background job for analytics pre-computation
 *
 * Runs on a configurable schedule (default: every hour) to:
 *   1. Log summary statistics for monitoring
 *   2. Detect sudden spikes in high-risk submissions
 *   3. Emit WebSocket events for significant changes
 *
 * Start with:  AnalyticsAggregator.start(io)
 * Stop  with:  AnalyticsAggregator.stop()
 */

import cron      from "node-cron";
import Log       from "../models/Log.js";
import PromptLog from "../models/PromptLog.js";
import Alert     from "../models/Alert.js";
import logger    from "../config/logging.js";

let task = null;

/** Minimum high-risk submissions per hour to trigger a spike alert */
const HIGH_RISK_SPIKE_THRESHOLD = 10;

const aggregate = async (io) => {
  try {
    const now        = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    // ── Count activity in the last hour ────────────────────────────────────
    const [totalLastHour, highLastHour, avgScore] = await Promise.all([
      Log.countDocuments({ timestamp: { $gte: oneHourAgo } }),
      Log.countDocuments({ riskLevel: "HIGH", timestamp: { $gte: oneHourAgo } }),
      PromptLog.aggregate([
        { $match: { timestamp: { $gte: oneHourAgo } } },
        { $group: { _id: null, avg: { $avg: "$numericRiskScore" } } },
      ]),
    ]);

    const avgRiskScore = avgScore[0]?.avg?.toFixed(1) ?? "0.0";

    logger.info("AnalyticsAggregator hourly summary", {
      submissionsLastHour: totalLastHour,
      highRiskLastHour:    highLastHour,
      avgRiskScore,
    });

    // ── Spike detection: high-risk spike in last hour → emit alert ────────
    if (highLastHour >= HIGH_RISK_SPIKE_THRESHOLD && io) {
      io.emit("risk_spike", {
        type:        "HIGH_RISK_SPIKE",
        count:       highLastHour,
        avgScore,
        window:      "1h",
        detectedAt:  now.toISOString(),
        message:     `⚠️ Spike detected: ${highLastHour} high-risk submissions in the last hour`,
      });
      logger.warn("HIGH_RISK_SPIKE detected", { count: highLastHour });
    }

    // ── Broadcast current unread alert count ───────────────────────────────
    if (io) {
      const unread = await Alert.countDocuments({ isRead: false, isDismissed: false });
      io.emit("unread_alert_count", { count: unread });
    }
  } catch (err) {
    logger.error("AnalyticsAggregator error", { error: err.message });
  }
};

/**
 * Start the aggregator cron job.
 * @param {import("socket.io").Server} io
 * @param {string} [schedule="0 * * * *"]  — default: every hour
 */
export const start = (io, schedule = "0 * * * *") => {
  if (task) return;
  task = cron.schedule(schedule, () => aggregate(io));
  logger.info(`AnalyticsAggregator started (schedule: ${schedule})`);
};

/**
 * Stop the aggregator.
 */
export const stop = () => {
  if (task) {
    task.stop();
    task = null;
    logger.info("AnalyticsAggregator stopped");
  }
};

export default { start, stop };
