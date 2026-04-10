import express from "express";
import {
  submitActivity,
  getMyActivities,
  getAllActivities,
  getActivityById,
  flagActivity,
  approveActivity,
  blockActivity,
  getFilteredActivities,
  getStatistics,
  getRiskTrend,
  getTopUsers,
} from "../controllers/activityController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// User routes (authenticated)
router.post("/submit", protect, submitActivity);
router.get("/me", protect, getMyActivities);

// Admin-only routes — specific paths must come before /:id
router.get("/stats/dashboard", protect, adminOnly, getStatistics);
router.get("/charts/trend", protect, adminOnly, getRiskTrend);
router.get("/charts/users", protect, adminOnly, getTopUsers);
router.get("/filter", protect, adminOnly, getFilteredActivities);
router.get("/all", protect, adminOnly, getAllActivities);
router.get("/:id", protect, adminOnly, getActivityById);
router.put("/:id/flag", protect, adminOnly, flagActivity);
router.put("/:id/approve", protect, adminOnly, approveActivity);
router.put("/:id/block", protect, adminOnly, blockActivity);

export default router;
