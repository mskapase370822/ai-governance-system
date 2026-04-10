import express from "express";
import { getDashboardStats, getUserStats } from "../controllers/analyticsController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, adminOnly, getDashboardStats);
router.get("/me", protect, getUserStats);

export default router;
