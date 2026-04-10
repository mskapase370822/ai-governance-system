import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { trainModel, predictRisk, getModelStats, analyzeRiskEndpoint } from "../controllers/mlController.js";
import { apiLimiter, submitLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/train", protect, adminOnly, trainModel);
router.post("/predict", protect, submitLimiter, predictRisk);
router.get("/stats", protect, adminOnly, getModelStats);
router.post("/analyze-risk", protect, submitLimiter, analyzeRiskEndpoint);

export default router;
