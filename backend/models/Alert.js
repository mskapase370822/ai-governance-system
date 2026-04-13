import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: { type: String },
  userRole: { type: String },
  action: { type: String },
  riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
  reason: { type: String },
  type: {
    type: String,
    enum: ["risk_alert", "anomaly_alert", "policy_violation", "approval_request", "rejection"],
    default: "risk_alert",
  },
  isRead: { type: Boolean, default: false },
  isDismissed: { type: Boolean, default: false },
  relatedLogId: { type: mongoose.Schema.Types.ObjectId, ref: "Log" },
  timestamp: { type: Date, default: Date.now },
});

alertSchema.index({ timestamp: -1 });
alertSchema.index({ isRead: 1 });
alertSchema.index({ type: 1 });

export default mongoose.model("Alert", alertSchema);
