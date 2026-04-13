import express from "express";
import {
  getPendingApprovals, getAllApprovals, getMyApprovals,
  approveRequest, denyRequest, rejectRequest,
} from "../controllers/approvalController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { apiLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/pending", protect, adminOnly, apiLimiter, getPendingApprovals);
router.get("/all", protect, adminOnly, apiLimiter, getAllApprovals);
router.get("/me", protect, apiLimiter, getMyApprovals);
router.put("/:id/approve", protect, adminOnly, apiLimiter, approveRequest);
router.put("/:id/deny", protect, adminOnly, apiLimiter, denyRequest);
router.put("/:id/reject", protect, adminOnly, apiLimiter, rejectRequest);

export default router;
