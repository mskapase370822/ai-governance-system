import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  inputText: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, immutable: true },
  riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
  status: {
    type: String,
    enum: ["PENDING", "FLAGGED", "APPROVED", "BLOCKED"],
    default: "PENDING",
  },
  reason: { type: String, default: "" },
  isBlocked: { type: Boolean, default: false },
  confidence: { type: Number, default: 0 },
  aiAnalysis: { type: String, default: "" },
});

// Indexes for efficient querying
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ riskLevel: 1 });
userActivitySchema.index({ status: 1 });
userActivitySchema.index({ timestamp: -1 });

export default mongoose.model("UserActivity", userActivitySchema);
