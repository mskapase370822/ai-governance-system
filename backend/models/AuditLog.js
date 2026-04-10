import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actor: {
    id:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    role:     { type: String, required: true },
  },
  action:     { type: String, required: true }, // e.g. "DELETE_POLICY", "UPDATE_USER_ROLE"
  entity:     { type: String, required: true }, // e.g. "Policy", "User", "ApprovalRequest"
  entityId:   { type: String, default: "" },    // the ID of the affected document
  details:    { type: mongoose.Schema.Types.Mixed, default: {} }, // extra context
  ip:         { type: String, default: "" },
  timestamp:  { type: Date, default: Date.now },
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ "actor.id": 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
