import express from "express";
import { getAlerts, markAlertRead, markAllAlertsRead, dismissAlert } from "../controllers/alertController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getAlerts);
router.put("/:id/read", protect, adminOnly, markAlertRead);
router.put("/read-all", protect, adminOnly, markAllAlertsRead);
router.put("/:id/dismiss", protect, adminOnly, dismissAlert);

export default router;
