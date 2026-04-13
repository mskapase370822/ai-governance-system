/**
 * jobs/AlertProcessor.js — Background job for processing and routing alerts
 *
 * Runs on a configurable schedule (default: every 5 minutes) to:
 *   1. Find high-severity unprocessed alerts
 *   2. Emit WebSocket notifications for any alerts that weren't delivered
 *   3. Auto-dismiss low-priority read alerts older than 7 days
 *
 * Start with:  AlertProcessor.start(io)
 * Stop  with:  AlertProcessor.stop()
 */

import cron  from "node-cron";
import Alert from "../models/Alert.js";
import logger from "../config/logging.js";

let task = null;

/**
 * Process pending alerts.
 * @param {import("socket.io").Server} io
 */
const processAlerts = async (io) => {
  try {
    // ── 1. Auto-dismiss old read alerts (>7 days) ──────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dismissed    = await Alert.updateMany(
      { isRead: true, isDismissed: false, timestamp: { $lte: sevenDaysAgo } },
      { isDismissed: true }
    );

    if (dismissed.modifiedCount > 0) {
      logger.info(`AlertProcessor: auto-dismissed ${dismissed.modifiedCount} old alerts`);
    }

    // ── 2. Broadcast unread CRITICAL/HIGH alerts via WebSocket ─────────────
    if (io) {
      const pending = await Alert
        .find({ isRead: false, isDismissed: false, riskLevel: { $in: ["HIGH", "CRITICAL"] } })
        .sort({ timestamp: -1 })
        .limit(20)
        .populate("userId", "username role");

      if (pending.length > 0) {
        io.emit("pending_alerts", {
          count:  pending.length,
          alerts: pending.map((a) => ({
            id:        a._id,
            riskLevel: a.riskLevel,
            username:  a.username,
            reason:    a.reason,
            timestamp: a.timestamp,
          })),
        });
      }
    }
  } catch (err) {
    logger.error("AlertProcessor error", { error: err.message });
  }
};

/**
 * Start the alert processor cron job.
 * @param {import("socket.io").Server} io
 * @param {string} [schedule]  — cron expression (default: every 5 minutes)
 */
export const start = (io, schedule = "*/5 * * * *") => {
  if (task) return; // already running
  task = cron.schedule(schedule, () => processAlerts(io));
  logger.info(`AlertProcessor started (schedule: ${schedule})`);
};

/**
 * Stop the alert processor.
 */
export const stop = () => {
  if (task) {
    task.stop();
    task = null;
    logger.info("AlertProcessor stopped");
  }
};

export default { start, stop };
