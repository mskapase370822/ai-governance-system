/**
 * Report Routes
 * POST /api/reports/export  — export activities as CSV or PDF (admin only)
 */
import express from "express";
import UserActivity from "../models/UserActivity.js";
import { generateActivityReport } from "../services/reportService.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/reports/export
 * Body: { format, startDate, endDate, riskLevel, status }
 */
router.post("/export", protect, adminOnly, async (req, res) => {
  try {
    const { format = "csv", startDate, endDate, riskLevel, status } = req.body;

    if (!["csv", "pdf"].includes(format)) {
      return res.status(400).json({ error: "Format must be 'csv' or 'pdf'." });
    }

    // Build query
    const query = {};
    if (riskLevel && riskLevel !== "all") query.riskLevel = riskLevel.toUpperCase();
    if (status && status !== "all") query.status = status.toUpperCase();
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Fetch up to 5000 records for export
    const [activities, stats] = await Promise.all([
      UserActivity.find(query)
        .populate("userId", "username role")
        .sort({ timestamp: -1 })
        .limit(5000),
      UserActivity.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            highRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } },
            mediumRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "MEDIUM"] }, 1, 0] } },
            lowRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "LOW"] }, 1, 0] } },
            flagged: { $sum: { $cond: [{ $eq: ["$status", "FLAGGED"] }, 1, 0] } },
            blocked: { $sum: { $cond: [{ $eq: ["$status", "BLOCKED"] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const filters = { startDate, endDate, riskLevel, status };
    const { buffer, contentType, filename } = await generateActivityReport(
      activities,
      stats[0] || {},
      filters,
      format
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
