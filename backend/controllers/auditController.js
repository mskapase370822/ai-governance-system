import AuditLog from "../models/AuditLog.js";
import mongoose from "mongoose";

/**
 * GET /api/audit
 * Admin: list audit logs with pagination.
 */
export const getAuditLogs = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip  = (page - 1) * limit;

    const query = {};
    if (req.query.action) query.action = String(req.query.action).substring(0, 64);
    if (req.query.entity) query.entity = String(req.query.entity).substring(0, 64);
    if (req.query.actorId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.actorId)) {
        return res.status(400).json({ error: "Invalid actorId format" });
      }
      query["actor.id"] = new mongoose.Types.ObjectId(req.query.actorId);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query),
    ]);

    res.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
