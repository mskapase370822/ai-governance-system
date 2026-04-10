import ApprovalRequest from "../models/ApprovalRequest.js";
import Log from "../models/Log.js";

/**
 * Get pending approvals (Admin only)
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const approvals = await ApprovalRequest.find({ status: "pending" })
      .populate("requestedBy", "username role department")
      .sort({ createdAt: -1 });
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get all approvals with filtering
 */
export const getAllApprovals = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const approvals = await ApprovalRequest.find(filter)
      .populate("requestedBy", "username role department")
      .populate("reviewedBy", "username role")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get my approval requests (for employees)
 */
export const getMyApprovals = async (req, res) => {
  try {
    const approvals = await ApprovalRequest.find({ requestedBy: req.user._id })
      .populate("reviewedBy", "username role")
      .sort({ createdAt: -1 });
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Approve a request (Admin only)
 */
export const approveRequest = async (req, res) => {
  try {
    const { reviewNote } = req.body;
    const approval = await ApprovalRequest.findById(req.params.id);

    if (!approval) return res.status(404).json({ error: "Approval request not found" });
    if (approval.status !== "pending") {
      return res.status(400).json({ error: "This request has already been reviewed" });
    }

    approval.status = "approved";
    approval.reviewedBy = req.user._id;
    approval.reviewedByUsername = req.user.username;
    approval.reviewNote = reviewNote || "";
    approval.reviewedAt = new Date();
    await approval.save();

    // Update the related log
    if (approval.logId) {
      await Log.findByIdAndUpdate(approval.logId, {
        status: "approved",
        systemResponse: `Approved by Admin ${req.user.username}${reviewNote ? `: ${reviewNote}` : ""}`,
      });
    }

    // Notify via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.emit("approval_updated", {
        id: approval._id,
        status: "approved",
        reviewedBy: req.user.username,
        requestedBy: approval.requestedByUsername,
        action: approval.action?.substring(0, 100),
      });
    }

    res.json({ message: "Request approved", approval });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Deny a request (Admin only)
 */
export const denyRequest = async (req, res) => {
  try {
    const { reviewNote } = req.body;
    const approval = await ApprovalRequest.findById(req.params.id);

    if (!approval) return res.status(404).json({ error: "Approval request not found" });
    if (approval.status !== "pending") {
      return res.status(400).json({ error: "This request has already been reviewed" });
    }

    approval.status = "denied";
    approval.reviewedBy = req.user._id;
    approval.reviewedByUsername = req.user.username;
    approval.reviewNote = reviewNote || "";
    approval.reviewedAt = new Date();
    await approval.save();

    // Update the related log
    if (approval.logId) {
      await Log.findByIdAndUpdate(approval.logId, {
        status: "denied",
        systemResponse: `Denied by Admin ${req.user.username}${reviewNote ? `: ${reviewNote}` : ""}`,
      });
    }

    // Notify via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.emit("approval_updated", {
        id: approval._id,
        status: "denied",
        reviewedBy: req.user.username,
        requestedBy: approval.requestedByUsername,
        action: approval.action?.substring(0, 100),
      });
    }

    res.json({ message: "Request denied", approval });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
