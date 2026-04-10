import express from "express";
import {
  getPendingApprovals, getAllApprovals, getMyApprovals,
  approveRequest, denyRequest,
} from "../controllers/approvalController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/pending", protect, adminOnly, getPendingApprovals);
router.get("/all", protect, adminOnly, getAllApprovals);
router.get("/me", protect, getMyApprovals);
router.put("/:id/approve", protect, adminOnly, approveRequest);
router.put("/:id/deny", protect, adminOnly, denyRequest);

export default router;
