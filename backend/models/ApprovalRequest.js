import mongoose from "mongoose";

const approvalRequestSchema = new mongoose.Schema({
  // Who requested
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestedByUsername: { type: String },
  requestedByRole: { type: String },
  // What action
  action: { type: String, required: true },
  // Related log
  logId: { type: mongoose.Schema.Types.ObjectId, ref: "Log" },
  // Approval status
  status: {
    type: String,
    enum: ["pending", "approved", "denied"],
    default: "pending",
  },
  // Who approved/denied
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedByUsername: { type: String },
  reviewNote: { type: String, default: "" },
  reviewedAt: { type: Date },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
});

approvalRequestSchema.index({ status: 1, createdAt: -1 });
approvalRequestSchema.index({ requestedBy: 1 });

export default mongoose.model("ApprovalRequest", approvalRequestSchema);
