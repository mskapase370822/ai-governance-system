import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import reportService from "../services/reportService.js";

const router = express.Router();

/**
 * POST /api/reports/export
 * Generate and download a CSV or PDF report.
 * Query params: format (csv|pdf), riskLevel, status, startDate, endDate
 */
router.post("/export", protect, adminOnly, async (req, res) => {
  try {
    const { format = "csv", riskLevel, status, startDate, endDate } = req.query;
    const filters = { riskLevel, status, startDate, endDate };

    const { data } = await reportService.generateReport(filters, format);

    const timestamp = new Date().toISOString().split("T")[0];

    if (format === "pdf") {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="governance-report-${timestamp}.pdf"`,
      });
      return res.send(data);
    }

    res.set({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="governance-report-${timestamp}.csv"`,
    });
    return res.send(data);
  } catch (err) {
    console.error("Report export error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
