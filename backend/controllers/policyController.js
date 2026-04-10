import Policy from "../models/Policy.js";

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
    res.json({ message: "Policy deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
