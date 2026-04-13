/**
 * routes/v1/policies.js — Versioned policy management endpoints
 *
 * GET    /api/v1/policies/         — List all policies
 * GET    /api/v1/policies/:id      — Get one policy
 * POST   /api/v1/policies/         — Create a policy (admin)
 * PUT    /api/v1/policies/:id      — Update a policy (admin)
 * PUT    /api/v1/policies/:id/toggle — Enable/disable (admin)
 * DELETE /api/v1/policies/:id      — Delete (admin)
 */

import express from "express";
import { body } from "express-validator";
import { protect, adminOnly }  from "../../middleware/authMiddleware.js";
import { validateRequest }     from "../../middleware/validateRequest.js";
import * as PolicyService      from "../../services/PolicyService.js";
import { writeAuditLog }       from "../../services/AuditService.js";
import { apiLimiter }          from "../../core/security/RateLimiter.js";

const router = express.Router();
router.use(protect, apiLimiter);

// GET /api/v1/policies/
router.get("/", async (req, res, next) => {
  try {
    const policies = await PolicyService.getAllPolicies();
    res.json(policies);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/policies/:id
router.get("/:id", async (req, res, next) => {
  try {
    const policy = await PolicyService.getPolicyById(req.params.id);
    if (!policy) return res.status(404).json({ error: "Policy not found." });
    res.json(policy);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/policies/ (admin)
router.post(
  "/",
  adminOnly,
  [
    body("name").trim().notEmpty().withMessage("Policy name is required."),
    body("type").isIn(["block_keywords", "time_restriction", "role_restriction", "rate_limit", "custom"])
      .withMessage("Invalid policy type."),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const policy = await PolicyService.createPolicy({ ...req.body, createdBy: req.user._id });
      await writeAuditLog(req.user, "CREATE_POLICY", "Policy", policy._id, { name: policy.name }, req.ip);
      res.status(201).json(policy);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/policies/:id (admin)
router.put("/:id", adminOnly, async (req, res, next) => {
  try {
    const policy = await PolicyService.updatePolicy(req.params.id, req.body);
    if (!policy) return res.status(404).json({ error: "Policy not found." });
    await writeAuditLog(req.user, "UPDATE_POLICY", "Policy", policy._id, { name: policy.name }, req.ip);
    res.json(policy);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/policies/:id/toggle (admin)
router.put("/:id/toggle", adminOnly, async (req, res, next) => {
  try {
    const policy = await PolicyService.togglePolicy(req.params.id);
    if (!policy) return res.status(404).json({ error: "Policy not found." });
    await writeAuditLog(req.user, "TOGGLE_POLICY", "Policy", policy._id, { isActive: policy.isActive }, req.ip);
    res.json(policy);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/policies/:id (admin)
router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    const deleted = await PolicyService.deletePolicy(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Policy not found." });
    await writeAuditLog(req.user, "DELETE_POLICY", "Policy", req.params.id, {}, req.ip);
    res.json({ message: "Policy deleted successfully." });
  } catch (err) {
    next(err);
  }
});

export default router;
