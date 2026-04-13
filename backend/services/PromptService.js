/**
 * PromptService.js — Business logic for prompt submission and risk assessment
 *
 * Orchestrates the full pipeline:
 *   1. Validate input (PromptValidator)
 *   2. Compute weighted risk score (RiskScorer)
 *   3. Generate explainability (ExplainabilityEngine)
 *   4. Evaluate policies (policyEngine)
 *   5. RBAC + action decision
 *   6. Anomaly detection
 *   7. Persist to PromptLog + Log (backward-compat)
 *   8. Trigger alerts
 */

import Log           from "../models/Log.js";
import PromptLog     from "../models/PromptLog.js";
import Alert         from "../models/Alert.js";
import ApprovalRequest from "../models/ApprovalRequest.js";
import { computeRiskScore }     from "../core/riskEngine/RiskScorer.js";
import { generateExplanation }  from "../core/riskEngine/ExplainabilityEngine.js";
import { validatePrompt }       from "../core/validator/PromptValidator.js";
import { evaluatePolicies }     from "../utils/policyEngine.js";
import { detectAnomaly, updateBehaviorProfile } from "../utils/anomalyDetection.js";

// ── Action decision helper ────────────────────────────────────────────────────

const determineDecision = (riskLevel, userRole, policyResult) => {
  const role = (userRole || "").toLowerCase();

  if (!policyResult.allowed) {
    return {
      status: "blocked",
      systemResponse: `Blocked by policy: ${policyResult.violations.map((v) => v.reason).join("; ")}`,
    };
  }

  if (role === "admin") {
    return riskLevel === "HIGH"
      ? { status: "warned", systemResponse: "High-risk input flagged for admin review." }
      : { status: "allowed", systemResponse: "Input logged and allowed for admin." };
  }

  // Employee / default
  if (riskLevel === "HIGH") {
    return { status: "blocked", systemResponse: "High-risk input blocked and escalated for approval." };
  }
  if (riskLevel === "MEDIUM") {
    return { status: "warned", systemResponse: "Medium-risk input flagged. Confirm to proceed." };
  }
  return { status: "allowed", systemResponse: "Input logged and allowed." };
};

// ── Main service method ───────────────────────────────────────────────────────

/**
 * Process a prompt submission end-to-end.
 *
 * @param {Object} options
 * @param {string} options.rawPrompt  - Raw user input
 * @param {Object} options.user       - Authenticated user object (req.user)
 * @param {Object} options.meta       - { ipAddress, userAgent, promptSource, confirmed }
 * @param {Object} [options.io]       - Socket.io instance for real-time alerts
 * @returns {Promise<PromptResult>}
 */
export const processPrompt = async ({ rawPrompt, user, meta = {}, io = null }) => {
  // ── 1. Validate & sanitize ─────────────────────────────────────────────────
  const { valid, sanitized, error: validationError } = validatePrompt(rawPrompt);
  if (!valid) {
    throw Object.assign(new Error(validationError), { status: 400 });
  }
  const promptText = sanitized;

  // ── 2. Weighted risk scoring ───────────────────────────────────────────────
  const assessment = computeRiskScore(promptText, {
    userRole: user.role,
  });

  // ── 3. Explainability ──────────────────────────────────────────────────────
  const explanation = generateExplanation(assessment, { userId: user._id, userRole: user.role });

  // ── 4. Policy evaluation ───────────────────────────────────────────────────
  const policyResult = await evaluatePolicies(promptText, user);

  // ── 5. Decision ────────────────────────────────────────────────────────────
  let decision = determineDecision(assessment.riskLevel, user.role, policyResult);

  if (meta.confirmed && decision.status === "warned") {
    decision = { status: "allowed", systemResponse: "Input confirmed by user and allowed." };
  }

  // ── 6. Anomaly detection ───────────────────────────────────────────────────
  const anomaly = await detectAnomaly(user._id, assessment.riskLevel);

  if (anomaly.isAnomaly && decision.status === "allowed" && assessment.riskLevel !== "LOW") {
    decision.status = "warned";
    decision.systemResponse += ` ⚠️ Anomaly: ${anomaly.anomalyReason}`;
  }

  // ── 7a. Persist PromptLog (new, with full explainability) ─────────────────
  const promptLog = await PromptLog.create({
    userId:           user._id,
    action:           promptText,
    category:         assessment.category,
    riskLevel:        assessment.riskLevel,
    confidence:       assessment.confidence,
    reason:           assessment.reason,
    riskDetails:      assessment.riskDetails,
    numericRiskScore: assessment.score,
    triggeredRules:   assessment.triggeredRules,
    factorScores:     assessment.factorScores,
    explainability:   {
      summary:         explanation.summary,
      scoreLabel:      explanation.scoreLabel,
      topContributors: explanation.topContributors,
      factorBreakdown: explanation.factorBreakdown,
      recommendations: explanation.recommendations,
    },
    promptSource: meta.promptSource || "ui",
    status:          decision.status,
    systemResponse:  decision.systemResponse,
    isAnomaly:       anomaly.isAnomaly,
    anomalyReason:   anomaly.anomalyReason,
    userRole:        user.role,
    ipAddress:       meta.ipAddress || "",
    userAgent:       meta.userAgent || "",
  });

  // ── 7b. Also persist to legacy Log (backward-compat) ─────────────────────
  const log = await Log.create({
    userId:           user._id,
    action:           promptText,
    category:         assessment.category,
    riskLevel:        assessment.riskLevel,
    confidence:       assessment.confidence,
    reason:           assessment.reason,
    riskDetails:      assessment.riskDetails,
    status:           decision.status,
    systemResponse:   decision.systemResponse,
    isAnomaly:        anomaly.isAnomaly,
    anomalyReason:    anomaly.anomalyReason,
    userRole:         user.role,
    ipAddress:        meta.ipAddress || "",
    userAgent:        meta.userAgent || "",
  });

  // ── 8. Update behavior profile ─────────────────────────────────────────────
  await updateBehaviorProfile(user._id, assessment.riskLevel);

  // ── 9. Approval request (HIGH + non-admin) ─────────────────────────────────
  let approvalRequest = null;
  if (decision.status === "blocked" && assessment.riskLevel === "HIGH" && (user.role || "").toLowerCase() !== "admin") {
    approvalRequest = await ApprovalRequest.create({
      requestedBy:         user._id,
      requestedByUsername: user.username,
      requestedByRole:     user.role,
      action:              promptText,
      riskLevel:           assessment.riskLevel,
      confidence:          assessment.confidence,
      reason:              assessment.reason,
      riskDetails:         assessment.riskDetails,
      logId:               log._id,
      status:              "pending",
    });

    log.approvalRequestId = approvalRequest._id;
    log.status            = "pending_approval";
    log.systemResponse    = "High-risk input submitted for admin approval.";
    await log.save();

    promptLog.approvalRequestId = approvalRequest._id;
    promptLog.status            = "pending_approval";
    promptLog.systemResponse    = log.systemResponse;
    await promptLog.save();
  }

  // ── 10. Alerts + real-time events ─────────────────────────────────────────
  let alert = null;
  if (assessment.riskLevel === "HIGH" || assessment.riskLevel === "MEDIUM") {
    const alertSeverity = assessment.riskLevel === "HIGH" && anomaly.isAnomaly ? "CRITICAL" : assessment.riskLevel;

    alert = await Alert.create({
      userId:      user._id,
      username:    user.username,
      userRole:    user.role,
      action:      promptText.substring(0, 200),
      riskLevel:   alertSeverity,
      confidence:  assessment.confidence,
      reason:      assessment.reason,
      type:        anomaly.isAnomaly ? "anomaly_alert" : "risk_alert",
      relatedLogId: log._id,
    });

    if (io) {
      io.emit("risk_alert", {
        id:          alert._id,
        user:        user.username,
        userRole:    user.role,
        action:      promptText.substring(0, 100),
        riskLevel:   alertSeverity,
        numericScore: assessment.score,
        confidence:  assessment.confidence,
        reason:      assessment.reason,
        status:      log.status,
        isAnomaly:   anomaly.isAnomaly,
        anomalyReason: anomaly.anomalyReason,
        timestamp:   alert.timestamp,
      });

      if (approvalRequest) {
        io.emit("approval_request", {
          id:        approvalRequest._id,
          user:      user.username,
          action:    promptText.substring(0, 100),
          riskLevel: assessment.riskLevel,
          timestamp: approvalRequest.createdAt,
        });
      }
    }
  }

  // ── Return structured result ───────────────────────────────────────────────
  return {
    log:          await Log.findById(log._id).populate("userId", "username role"),
    promptLog,
    riskAnalysis: {
      riskLevel:    assessment.riskLevel,
      numericScore: assessment.score,
      confidence:   assessment.confidence,
      reason:       assessment.reason,
      riskDetails:  assessment.riskDetails,
      category:     assessment.category,
      factorScores: assessment.factorScores,
      triggeredRules: assessment.triggeredRules,
    },
    explainability: explanation,
    decision: {
      status:         log.status,
      systemResponse: log.systemResponse,
    },
    anomaly: {
      isAnomaly:    anomaly.isAnomaly,
      anomalyReason: anomaly.anomalyReason,
    },
    approvalRequest: approvalRequest
      ? { id: approvalRequest._id, status: approvalRequest.status }
      : null,
    alert: alert ? { id: alert._id } : null,
  };
};

export default { processPrompt };
