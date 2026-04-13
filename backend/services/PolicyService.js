/**
 * PolicyService.js — Policy CRUD and enforcement business logic
 *
 * Thin wrapper around the Policy model + policyEngine so controllers
 * only deal with HTTP concerns.
 */

import Policy from "../models/Policy.js";
import { evaluatePolicies } from "../utils/policyEngine.js";

/**
 * Get all policies, sorted by priority (descending).
 * @returns {Promise<Policy[]>}
 */
export const getAllPolicies = async () =>
  Policy.find().sort({ priority: -1, createdAt: -1 });

/**
 * Get a policy by ID.
 * @param {string} id
 * @returns {Promise<Policy|null>}
 */
export const getPolicyById = async (id) => Policy.findById(id);

/**
 * Create a new policy.
 * @param {Object} data
 * @returns {Promise<Policy>}
 */
export const createPolicy = async (data) => Policy.create(data);

/**
 * Update a policy by ID.
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Policy|null>}
 */
export const updatePolicy = async (id, updates) => {
  // Strip any MongoDB operator keys from user-provided updates to prevent injection
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => !k.startsWith("$"))
  );
  safeUpdates.updatedAt = new Date();
  return Policy.findByIdAndUpdate(id, safeUpdates, { new: true, runValidators: true });
};

/**
 * Toggle a policy's active status.
 * @param {string} id
 * @returns {Promise<Policy|null>}
 */
export const togglePolicy = async (id) => {
  const policy = await Policy.findById(id);
  if (!policy) return null;
  policy.isActive  = !policy.isActive;
  policy.updatedAt = new Date();
  return policy.save();
};

/**
 * Delete a policy by ID.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export const deletePolicy = async (id) => {
  const result = await Policy.findByIdAndDelete(id);
  return !!result;
};

/**
 * Evaluate active policies against a prompt + user.
 * Re-exports evaluatePolicies for a unified import path.
 */
export { evaluatePolicies };

export default {
  getAllPolicies,
  getPolicyById,
  createPolicy,
  updatePolicy,
  togglePolicy,
  deletePolicy,
  evaluatePolicies,
};
