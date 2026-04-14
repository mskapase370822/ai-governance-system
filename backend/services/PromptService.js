/**
 * PromptService.js — Business logic for action submission and approval workflow
 *
 * Pipeline:
 *   1. Validate input (PromptValidator)
 *   2. Evaluate policies (hard blocks)
 *   3. Persist to Log with status = "pending_approval"
 *   4. Create ApprovalRequest
 *   5. Create alert for new approval request
 *   6. Notify via WebSocket
 */

import Log           from "../models/Log.js";
import Alert         from "../models/Alert.js";
import ApprovalRequest from "../models/ApprovalRequest.js";
import { validatePrompt }   from "../core/validator/PromptValidator.js";
import { evaluatePolicies } from "../utils/policyEngine.js";

// ── Main service method ───────────────────────────────────────────────────────

/**
 * Process an action submission end-to-end.
 *
 * @param {Object} options
 * @param {string} options.rawPrompt  - Raw user input
 * @param {Object} options.user       - Authenticated user object (req.user)
 * @param {Object} options.meta       - { ipAddress, userAgent, promptSource }
 * @param {Object} [options.io]       - Socket.io instance for real-time notifications
 * @returns {Promise<SubmitResult>}
 */
export const processPrompt = async ({ rawPrompt, user, meta = {}, io = null }) => {
  // ── 1. Validate & sanitize ─────────────────────────────────────────────────
  const { valid, sanitized, error: validationError } = validatePrompt(rawPrompt);
  if (!valid) {
    throw Object.assign(new Error(validationError), { status: 400 });
  }
  const promptText = sanitized;

  // ── 2. Policy evaluation (hard blocks only) ────────────────────────────────
  const policyResult = await evaluatePolicies(promptText, user);

  if (!policyResult.allowed) {
    const systemResponse = `Blocked by policy: ${policyResult.violations.map((v) => v.reason).join("; ")}`;
    const log = await Log.create({
      userId:         user._id,
      action:         promptText,
      riskLevel:      "HIGH",
      status:         "blocked",
      systemResponse,
      userRole:       user.role,
      ipAddress:      meta.ipAddress || "",
      userAgent:      meta.userAgent || "",
    });

    const populated = await Log.findById(log._id).populate("userId", "username role");
    return {
      log: populated,
      decision: { status: "blocked", systemResponse },
      approvalRequest: null,
    };
  }

  // ── 3. Persist Log with pending_approval ──────────────────────────────────
  const log = await Log.create({
    userId:         user._id,
    action:         promptText,
    riskLevel:      "LOW",
    status:         "pending_approval",
    systemResponse: "Action submitted and awaiting admin approval.",
    userRole:       user.role,
    ipAddress:      meta.ipAddress || "",
    userAgent:      meta.userAgent || "",
  });

  // ── 4. Create ApprovalRequest ─────────────────────────────────────────────
  const approvalRequest = await ApprovalRequest.create({
    requestedBy:         user._id,
    requestedByUsername: user.username,
    requestedByRole:     user.role,
    action:              promptText,
    logId:               log._id,
    status:              "pending",
  });

  log.approvalRequestId = approvalRequest._id;
  await log.save();

  // ── 5. Create alert for new approval request ──────────────────────────────
  await Alert.create({
    userId:   user._id,
    username: user.username,
    userRole: user.role,
    action:   promptText.substring(0, 200),
    type:     "approval_request",
    relatedLogId: log._id,
  });

  // ── 6. WebSocket notification ─────────────────────────────────────────────
  if (io) {
    io.emit("approval_request", {
      id:        approvalRequest._id,
      user:      user.username,
      action:    promptText.substring(0, 100),
      timestamp: approvalRequest.createdAt,
    });
  }

  // ── Return structured result ───────────────────────────────────────────────
  const populated = await Log.findById(log._id).populate("userId", "username role");
  return {
    log: populated,
    decision: {
      status:         "pending_approval",
      systemResponse: "Action submitted and awaiting admin approval.",
    },
    approvalRequest: { id: approvalRequest._id, status: "pending" },
  };
};

export default { processPrompt };

