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
  if (action)    query.action      = new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  if (entity)    query.entity      = entity;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate)   query.timestamp.$lte = new Date(endDate);
  }

  const skip  = (page - 1) * limit;
  const total = await AuditLog.countDocuments(query);

  const pageNum  = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const safeSkip = (pageNum - 1) * limitNum;

  const logs  = await AuditLog
    .find(query)
    .sort({ timestamp: -1 })
    .skip(safeSkip)
    .limit(limitNum);

  return { logs, total, page: pageNum, pages: Math.ceil(total / limitNum) };
};

/**
 * Write an audit log entry.
 * Re-exports writeAuditLog for a unified import.
 */
export { writeAuditLog };

export default { getAuditLogs, writeAuditLog };
