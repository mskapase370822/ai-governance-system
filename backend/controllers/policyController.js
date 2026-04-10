import Policy from "../models/Policy.js";
import { writeAuditLog } from "../utils/auditLogger.js";

/**
 * Get all policies
 */
export const getPolicies = async (req, res) => {
  try {
    const policies = await Policy.find()
      .populate("createdBy", "username")
      .sort({ priority: -1, createdAt: -1 });
    res.json(policies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get single policy
 */
export const getPolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ error: "Policy not found" });
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Create a new policy (Admin only)
 */
export const createPolicy = async (req, res) => {
  try {
    const policy = await Policy.create({
      ...req.body,
      createdBy: req.user._id,
    });
    await writeAuditLog(req.user, "CREATE_POLICY", "Policy", policy._id, { name: policy.name }, req.ip);
    res.status(201).json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Update a policy (Admin only)
 */
export const updatePolicy = async (req, res) => {
  try {
    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!policy) return res.status(404).json({ error: "Policy not found" });
    await writeAuditLog(req.user, "UPDATE_POLICY", "Policy", policy._id, { name: policy.name }, req.ip);
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Toggle policy active/inactive
 */
export const togglePolicy = async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) return res.status(404).json({ error: "Policy not found" });
    policy.isActive = !policy.isActive;
    policy.updatedAt = Date.now();
    await policy.save();
    await writeAuditLog(req.user, "TOGGLE_POLICY", "Policy", policy._id, { name: policy.name, isActive: policy.isActive }, req.ip);
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Delete a policy (Admin only)
 */
export const deletePolicy = async (req, res) => {
  try {
    const policy = await Policy.findByIdAndDelete(req.params.id);
    if (!policy) return res.status(404).json({ error: "Policy not found" });
    await writeAuditLog(req.user, "DELETE_POLICY", "Policy", req.params.id, { name: policy.name }, req.ip);
    res.json({ message: "Policy deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
