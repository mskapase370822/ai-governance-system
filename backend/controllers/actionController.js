/**
 * Action Controller — The central action processing pipeline
 * 
 * Pipeline: Action → Rule Engine → AI Analysis → RBAC Check → Policy Engine →
 *           Anomaly Detection → Action Control Decision → Log & Alert
 */
import Log from "../models/Log.js";
import Alert from "../models/Alert.js";
import ApprovalRequest from "../models/ApprovalRequest.js";
import { detectRisk, categorizeAction } from "../utils/detectRisk.js";
import { detectAnomaly, updateBehaviorProfile } from "../utils/anomalyDetection.js";
import { evaluatePolicies } from "../utils/policyEngine.js";
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Call the ML service for AI-based risk classification
 */
const getAIRiskAnalysis = async (action) => {
  try {
    const containsCode = /[{}();=<>]/.test(action) || /\b(function|const|let|var|import|class|def|return)\b/i.test(action);
    const res = await axios.post(`${ML_SERVICE_URL}/predict-risk`, {
      prompt_length: action.length,
      contains_code: containsCode,
      user_dept: "general",
      action_text: action,
    }, { timeout: 3000 });
    return {
      riskLevel: res.data.risk_level || "LOW",
      confidence: res.data.confidence || 0.5,
      reason: res.data.reason || "AI classification",
    };
  } catch {
    return null; // ML service unavailable — will use rule-based only
  }
};

/**
 * Combine rule-based and AI risk assessments
 */
const combineRiskAssessments = (ruleResult, aiResult) => {
  if (!aiResult) return ruleResult;

  const riskOrder = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  // Take the higher of the two risk levels
  if (riskOrder[aiResult.riskLevel] > riskOrder[ruleResult.riskLevel]) {
    return {
      ...ruleResult,
      riskLevel: aiResult.riskLevel,
      confidence: Math.max(ruleResult.confidence, aiResult.confidence),
      reason: `${aiResult.reason}. Rule engine also found: ${ruleResult.reason}`,
      riskDetails: [...ruleResult.riskDetails, `AI: ${aiResult.reason}`],
    };
  }
  return {
    ...ruleResult,
    confidence: Math.max(ruleResult.confidence, aiResult.confidence),
    riskDetails: [...ruleResult.riskDetails, `AI confirms: ${aiResult.riskLevel} risk`],
  };
};

/**
 * Determine action control decision based on risk level and user role
 */
const determineActionDecision = (riskLevel, userRole, policyResult) => {
  // Policy violations always block
  if (!policyResult.allowed) {
    return {
      status: "blocked",
      systemResponse: `Action blocked by policy: ${policyResult.violations.map((v) => v.reason).join("; ")}`,
    };
  }

  // RBAC: Admins can do anything
  if (userRole === "Admin") {
    if (riskLevel === "HIGH") {
      return {
        status: "warned",
        systemResponse: "High-risk action allowed for Admin with warning.",
      };
    }
    return { status: "allowed", systemResponse: "Action allowed for Admin." };
  }

  // RBAC: Managers can handle medium risk, need approval for high
  if (userRole === "Manager") {
    if (riskLevel === "HIGH") {
      return {
        status: "pending_approval",
        systemResponse: "High-risk action requires Admin approval.",
      };
    }
    if (riskLevel === "MEDIUM") {
      return {
        status: "warned",
        systemResponse: "Medium-risk action allowed for Manager with warning.",
      };
    }
    return { status: "allowed", systemResponse: "Action allowed." };
  }

  // Employee: Low → allow, Medium → warn + confirm, High → block/need approval
  if (riskLevel === "HIGH") {
    return {
      status: "blocked",
      systemResponse: "High-risk action blocked. Requires Admin approval to proceed.",
    };
  }
  if (riskLevel === "MEDIUM") {
    return {
      status: "warned",
      systemResponse: "Medium-risk action detected. Please confirm to proceed.",
    };
  }
  return { status: "allowed", systemResponse: "Action allowed — no risk detected." };
};

/**
 * Main action submission handler — processes through all layers
 */
export const submitAction = async (req, res) => {
  try {
    const { action, confirmed } = req.body;
    const user = req.user;

    if (!action || !action.trim()) {
      return res.status(400).json({ error: "Action text is required." });
    }

    // === Layer 1: Rule-Based Risk Detection ===
    const ruleResult = detectRisk(action);

    // === Layer 2: AI-Based Risk Analysis ===
    const aiResult = await getAIRiskAnalysis(action);
    const combinedRisk = combineRiskAssessments(ruleResult, aiResult);

    // === Layer 3: Policy Engine ===
    const policyResult = await evaluatePolicies(action, user);

    // === Layer 4: RBAC + Action Control Decision ===
    let decision = determineActionDecision(
      combinedRisk.riskLevel,
      user.role,
      policyResult
    );

    // If user confirmed a warning, allow it
    if (confirmed && decision.status === "warned") {
      decision.status = "allowed";
      decision.systemResponse = "Action confirmed by user and allowed.";
    }

    // === Layer 5: Anomaly Detection ===
    const anomaly = await detectAnomaly(user._id, combinedRisk.riskLevel);

    // If anomaly detected, escalate
    if (anomaly.isAnomaly && decision.status === "allowed" && combinedRisk.riskLevel !== "LOW") {
      decision.status = "warned";
      decision.systemResponse += ` ⚠️ Anomaly detected: ${anomaly.anomalyReason}`;
    }

    // === Create Log Entry ===
    const log = await Log.create({
      userId: user._id,
      action,
      category: combinedRisk.category,
      riskLevel: combinedRisk.riskLevel,
      confidence: combinedRisk.confidence,
      reason: combinedRisk.reason,
      riskDetails: combinedRisk.riskDetails,
      status: decision.status,
      systemResponse: decision.systemResponse,
      isAnomaly: anomaly.isAnomaly,
      anomalyReason: anomaly.anomalyReason,
      userRole: user.role,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // === Update Behavior Profile ===
    await updateBehaviorProfile(user._id, combinedRisk.riskLevel);

    // === Create Approval Request if needed ===
    let approvalRequest = null;
    if (decision.status === "blocked" && combinedRisk.riskLevel === "HIGH" && user.role !== "Admin") {
      approvalRequest = await ApprovalRequest.create({
        requestedBy: user._id,
        requestedByUsername: user.username,
        requestedByRole: user.role,
        action,
        riskLevel: combinedRisk.riskLevel,
        confidence: combinedRisk.confidence,
        reason: combinedRisk.reason,
        riskDetails: combinedRisk.riskDetails,
        logId: log._id,
        status: "pending",
      });

      log.approvalRequestId = approvalRequest._id;
      log.status = "pending_approval";
      log.systemResponse = "High-risk action submitted for Admin approval.";
      await log.save();
    }

    // === Generate Alerts for Medium/High risk ===
    if (combinedRisk.riskLevel === "HIGH" || combinedRisk.riskLevel === "MEDIUM") {
      const alert = await Alert.create({
        userId: user._id,
        username: user.username,
        userRole: user.role,
        action: action.substring(0, 200),
        riskLevel: combinedRisk.riskLevel,
        confidence: combinedRisk.confidence,
        reason: combinedRisk.reason,
        type: anomaly.isAnomaly ? "anomaly_alert" : "risk_alert",
        relatedLogId: log._id,
      });

      // === Real-time WebSocket notification ===
      const io = req.app.get("io");
      if (io) {
        io.emit("risk_alert", {
          id: alert._id,
          user: user.username,
          userRole: user.role,
          action: action.substring(0, 100),
          riskLevel: combinedRisk.riskLevel,
          confidence: combinedRisk.confidence,
          reason: combinedRisk.reason,
          status: log.status,
          isAnomaly: anomaly.isAnomaly,
          anomalyReason: anomaly.anomalyReason,
          timestamp: alert.timestamp,
        });

        if (approvalRequest) {
          io.emit("approval_request", {
            id: approvalRequest._id,
            user: user.username,
            action: action.substring(0, 100),
            riskLevel: combinedRisk.riskLevel,
            timestamp: approvalRequest.createdAt,
          });
        }
      }
    }

    // === Return Response ===
    const populated = await Log.findById(log._id).populate("userId", "username role");

    res.status(201).json({
      log: populated,
      riskAnalysis: {
        riskLevel: combinedRisk.riskLevel,
        confidence: combinedRisk.confidence,
        reason: combinedRisk.reason,
        riskDetails: combinedRisk.riskDetails,
        category: combinedRisk.category,
      },
      decision: {
        status: log.status,
        systemResponse: log.systemResponse,
      },
      anomaly: {
        isAnomaly: anomaly.isAnomaly,
        anomalyReason: anomaly.anomalyReason,
      },
      approvalRequest: approvalRequest
        ? { id: approvalRequest._id, status: approvalRequest.status }
        : null,
    });
  } catch (err) {
    console.error("Action submission error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Employee confirms a warned action
 */
export const confirmAction = async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await Log.findById(logId);

    if (!log) return res.status(404).json({ error: "Log not found" });
    if (log.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (log.status !== "warned") {
      return res.status(400).json({ error: "This action cannot be confirmed" });
    }

    log.status = "allowed";
    log.systemResponse = "Action confirmed by user after warning.";
    await log.save();

    res.json({ message: "Action confirmed", log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
