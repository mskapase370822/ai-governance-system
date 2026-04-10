import express from "express";
import { getDashboardStats, getUserStats } from "../controllers/analyticsController.js";
import { protect, managerOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, managerOrAdmin, getDashboardStats);
router.get("/me", protect, getUserStats);

export default router;
