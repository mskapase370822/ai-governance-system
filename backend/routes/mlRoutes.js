import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { trainModel, predictRisk, getModelStats, analyzeRiskEndpoint } from "../controllers/mlController.js";

const router = express.Router();

router.post("/train", protect, adminOnly, trainModel);
router.post("/predict", protect, predictRisk);
router.get("/stats", protect, adminOnly, getModelStats);
router.post("/analyze-risk", protect, analyzeRiskEndpoint);

export default router;
