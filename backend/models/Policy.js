import mongoose from "mongoose";

const policySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  // Policy type
  type: {
    type: String,
    enum: ["block_keywords", "time_restriction", "role_restriction", "rate_limit", "custom"],
    required: true,
  },
  // Block keywords policy
  blockedKeywords: [{ type: String }],
  // Time-based restriction
  timeRestriction: {
    enabled: { type: Boolean, default: false },
    allowedStartHour: { type: Number, default: 9 },  // 9 AM
    allowedEndHour: { type: Number, default: 18 },    // 6 PM
    allowedDays: [{ type: Number }],                  // 0=Sun, 1=Mon, ...6=Sat
    timezone: { type: String, default: "Asia/Kolkata" },
  },
  // Role-based restriction
  roleRestriction: {
    enabled: { type: Boolean, default: false },
    blockedRoles: [{ type: String }],       // Roles that cannot perform certain actions
    allowedRoles: [{ type: String }],       // Roles that can perform certain actions
    action: { type: String, default: "" },  // Pattern to match
  },
  // Rate limiting
  rateLimit: {
    enabled: { type: Boolean, default: false },
    maxActions: { type: Number, default: 50 },
    windowMinutes: { type: Number, default: 60 },
  },
  // High-risk global policy
  blockHighRisk: { type: Boolean, default: false },
  requireApprovalForHigh: { type: Boolean, default: true },
  warnOnMedium: { type: Boolean, default: true },
  // Metadata
  priority: { type: Number, default: 0 }, // Higher = evaluated first
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

policySchema.index({ isActive: 1, priority: -1 });

export default mongoose.model("Policy", policySchema);
