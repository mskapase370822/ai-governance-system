/**
 * AuditService.js — Audit trail management
 *
 * Wraps AuditLog queries and the writeAuditLog utility so the rest
 * of the codebase has a single import point for audit concerns.
 */

import AuditLog from "../models/AuditLog.js";
import { writeAuditLog } from "../utils/auditLogger.js";

/**
 * Fetch paginated audit logs, optionally filtered.
 *
 * @param {Object} filters  - { actorId, action, entity, startDate, endDate, page, limit }
 * @returns {Promise<{ logs, total, page, pages }>}
 */
export const getAuditLogs = async ({
  actorId, action, entity, startDate, endDate, page = 1, limit = 50,
} = {}) => {
  const query = {};

  if (actorId)   query["actor.id"] = actorId;
  if (action)    query.action      = new RegExp(action, "i");
  if (entity)    query.entity      = entity;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate)   query.timestamp.$lte = new Date(endDate);
  }

  const skip  = (page - 1) * limit;
  const total = await AuditLog.countDocuments(query);
  const logs  = await AuditLog
    .find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  return { logs, total, page: Number(page), pages: Math.ceil(total / limit) };
};

/**
 * Write an audit log entry.
 * Re-exports writeAuditLog for a unified import.
 */
export { writeAuditLog };

export default { getAuditLogs, writeAuditLog };
