import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "Manager", "Employee", "admin", "manager", "employee"], default: "Employee" },
  department: { type: String, default: "General" },
  isActive: { type: Boolean, default: true },
  behaviorProfile: {
    avgActionsPerDay: { type: Number, default: 0 },
    avgRiskScore: { type: Number, default: 0 },
    totalActions: { type: Number, default: 0 },
    highRiskCount: { type: Number, default: 0 },
    lastActivityAt: { type: Date },
    recentRiskLevels: [{ type: String }],
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
