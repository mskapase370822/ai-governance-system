import express from "express";
import { getMyLogs, getAllLogs, getAnomalyLogs } from "../controllers/logController.js";
import { protect, adminOnly, managerOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyLogs);
router.get("/", protect, managerOrAdmin, getAllLogs);
router.get("/anomalies", protect, managerOrAdmin, getAnomalyLogs);

export default router;
