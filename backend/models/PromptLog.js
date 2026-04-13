/**
 * PromptLog.js — Enhanced log model with risk score and explainability fields
 *
 * Extends the base Log schema concept with:
 *   - numericRiskScore   : 0-100 weighted score
 *   - explainability     : structured explainability data from ExplainabilityEngine
 *   - triggeredRules     : array of which rules fired and their contributions
 *   - factorScores       : per-factor sub-scores
 *   - promptSource       : where the prompt originated (ui | api | integration)
 *   - apiKeyId           : API key reference for programmatic submissions
 *
 * This model is the canonical store for prompt governance records.
 */

import mongoose from "mongoose";

const triggeredRuleSchema = new mongoose.Schema(
  {
    ruleId:       { type: String },
    ruleName:     { type: String },
    factor:       { type: String },
    weight:       { type: Number },
    score:        { type: Number },
    severity:     { type: String },
    contribution: { type: Number },
    evidence:     [{ type: String }],
  },
  { _id: false }
);

const explainabilitySchema = new mongoose.Schema(
  {
    summary:         { type: String },
    scoreLabel:      { type: String },
    topContributors: { type: mongoose.Schema.Types.Mixed, default: [] },
    factorBreakdown: { type: mongoose.Schema.Types.Mixed, default: [] },
    recommendations: [{ type: String }],
  },
  { _id: false }
);

const promptLogSchema = new mongoose.Schema({
  // Core fields (compatible with existing Log model)
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action:    { type: String, required: true },
  category:  { type: String, default: "general" },

  // Risk classification
  riskLevel:  { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
  confidence: { type: Number, default: 0 },
  reason:     { type: String, default: "" },
  riskDetails: [{ type: String }],

  // NEW: numeric score (0-100) and explainability
  numericRiskScore: { type: Number, default: 0, min: 0, max: 100 },
  triggeredRules:   [triggeredRuleSchema],
  factorScores:     { type: mongoose.Schema.Types.Mixed, default: {} },
  explainability:   { type: explainabilitySchema, default: () => ({}) },

  // Prompt source
  promptSource: {
    type:    String,
    enum:    ["ui", "api", "integration"],
    default: "ui",
  },
  apiKeyId: { type: String, default: "" },

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
  isAnomaly:    { type: Boolean, default: false },
  anomalyReason: { type: String, default: "" },

  // Request metadata
  userRole:  { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },

  // Immutable audit timestamps
  timestamp: { type: Date, default: Date.now, immutable: true },
  createdAt: { type: Date, default: Date.now, immutable: true },
});

// ── Indexes ───────────────────────────────────────────────────────────────────
promptLogSchema.index({ userId: 1, timestamp: -1 });
promptLogSchema.index({ riskLevel: 1 });
promptLogSchema.index({ numericRiskScore: -1 });
promptLogSchema.index({ status: 1 });
promptLogSchema.index({ isAnomaly: 1 });
promptLogSchema.index({ timestamp: -1 });
promptLogSchema.index({ promptSource: 1 });

export default mongoose.model("PromptLog", promptLogSchema);
