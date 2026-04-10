import express from "express";
import { getAuditLogs } from "../controllers/auditController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { apiLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get("/", apiLimiter, protect, adminOnly, getAuditLogs);

export default router;
