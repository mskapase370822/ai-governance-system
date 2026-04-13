/**
 * AlertService.js — Alert management business logic
 *
 * Encapsulates all alert CRUD and query operations so controllers
 * stay thin and service logic is reusable across routes.
 */

import Alert from "../models/Alert.js";

/**
 * Fetch paginated alerts, optionally filtered.
 *
 * @param {Object} filters   - { type, riskLevel, isRead, page, limit }
 * @returns {Promise<{ alerts, total, page, pages }>}
 */
export const getAlerts = async ({ type, riskLevel, isRead, page = 1, limit = 20 } = {}) => {
  const query = { isDismissed: false };

  if (type)                        query.type      = type;
  if (riskLevel)                   query.riskLevel = riskLevel;
  if (isRead !== undefined && isRead !== "") {
    query.isRead = isRead === "true" || isRead === true;
  }

  const skip  = (page - 1) * limit;
  const total = await Alert.countDocuments(query);
  const alerts = await Alert
    .find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "username role");

  return { alerts, total, page: Number(page), pages: Math.ceil(total / limit) };
};

/**
 * Mark a single alert as read.
 * @param {string} alertId
 * @returns {Promise<Alert|null>}
 */
export const markRead = async (alertId) => {
  return Alert.findByIdAndUpdate(alertId, { isRead: true }, { new: true });
};

/**
 * Mark all unread alerts as read.
 * @returns {Promise<number>} number of updated documents
 */
export const markAllRead = async () => {
  const result = await Alert.updateMany({ isRead: false }, { isRead: true });
  return result.modifiedCount;
};

/**
 * Dismiss (soft-delete) an alert.
 * @param {string} alertId
 * @returns {Promise<Alert|null>}
 */
export const dismissAlert = async (alertId) => {
  return Alert.findByIdAndUpdate(alertId, { isDismissed: true }, { new: true });
};

/**
 * Count unread alerts.
 * @returns {Promise<number>}
 */
export const countUnread = async () => Alert.countDocuments({ isRead: false, isDismissed: false });

export default { getAlerts, markRead, markAllRead, dismissAlert, countUnread };
