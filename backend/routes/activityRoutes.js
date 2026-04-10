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
  getChartStats,
} from "../controllers/activityController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { submitLimiter, apiLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

// User routes (authenticated)
router.post("/submit", submitLimiter, protect, submitActivity);
router.get("/me", protect, getMyActivities);

// Admin-only routes — specific paths must come before /:id
router.get("/stats/charts", apiLimiter, protect, adminOnly, getChartStats);
router.get("/stats/dashboard", apiLimiter, protect, adminOnly, getStatistics);
router.get("/filter", apiLimiter, protect, adminOnly, getFilteredActivities);
router.get("/all", apiLimiter, protect, adminOnly, getAllActivities);
router.get("/:id", protect, adminOnly, getActivityById);
router.put("/:id/flag", protect, adminOnly, flagActivity);
router.put("/:id/approve", protect, adminOnly, approveActivity);
router.put("/:id/block", protect, adminOnly, blockActivity);

export default router;
