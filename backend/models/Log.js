import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  category: { type: String, default: "general" }, // sql, file-ops, config, access, data, general
  riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
  reason: { type: String, default: "" },
  riskDetails: [{ type: String }], // array of matched patterns/reasons
  // Action control
  status: {
    type: String,
    enum: ["allowed", "warned", "blocked", "pending_approval", "approved", "denied"],
    default: "allowed",
  },
  systemResponse: { type: String, default: "" },
  // Approval workflow
  approvalRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "ApprovalRequest" },
  // Anomaly tracking
  isAnomaly: { type: Boolean, default: false },
  anomalyReason: { type: String, default: "" },
  // Metadata
  userRole: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  // Immutable audit fields
  timestamp: { type: Date, default: Date.now, immutable: true },
  createdAt: { type: Date, default: Date.now, immutable: true },
});

// Index for efficient querying
logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ riskLevel: 1 });
logSchema.index({ status: 1 });
logSchema.index({ isAnomaly: 1 });
logSchema.index({ timestamp: -1 });

export default mongoose.model("Log", logSchema);
