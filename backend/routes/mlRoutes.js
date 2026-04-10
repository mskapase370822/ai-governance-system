/**
 * ML Routes
 * POST /api/ml/train   — train model (admin only)
 * POST /api/ml/predict — predict risk (authenticated)
 * GET  /api/ml/stats   — model stats (admin only)
 */
import express from "express";
import { trainMLModel, predictRiskLevel, getMLStats } from "../controllers/mlController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/train", protect, adminOnly, trainMLModel);
router.post("/predict", protect, predictRiskLevel);
router.get("/stats", protect, adminOnly, getMLStats);

export default router;
