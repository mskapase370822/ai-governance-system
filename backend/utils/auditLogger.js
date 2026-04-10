import AuditLog from "../models/AuditLog.js";

/**
 * Write an audit log entry.
 *
 * @param {object} actor    - req.user (must have ._id, .username, .role)
 * @param {string} action   - Screaming-snake action name, e.g. "DELETE_POLICY"
 * @param {string} entity   - Model/resource name, e.g. "Policy"
 * @param {string} entityId - The _id of the affected document
 * @param {object} details  - Any extra key/value context to record
 * @param {string} ip       - Request IP address
 */
export const writeAuditLog = async (actor, action, entity, entityId = "", details = {}, ip = "") => {
  try {
    await AuditLog.create({
      actor: {
        id:       actor._id,
        username: actor.username,
        role:     actor.role,
      },
      action,
      entity,
      entityId: String(entityId),
      details,
      ip,
    });
  } catch (err) {
    // Audit logging must never crash the main request
    console.error("⚠️  Audit log write failed:", err.message);
  }
};
