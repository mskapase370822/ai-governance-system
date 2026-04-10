import express from "express";
import { getAlerts, markAlertRead, markAllAlertsRead, dismissAlert } from "../controllers/alertController.js";
import { protect, managerOrAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, managerOrAdmin, getAlerts);
router.put("/:id/read", protect, managerOrAdmin, markAlertRead);
router.put("/read-all", protect, managerOrAdmin, markAllAlertsRead);
router.put("/:id/dismiss", protect, managerOrAdmin, dismissAlert);

export default router;
