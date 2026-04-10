import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import metricsService from "../services/metricsService.js";
import { promClient } from "../middleware/metricsMiddleware.js";

const router = express.Router();

/**
 * GET /api/metrics/health
 * System health data (admin only).
 */
router.get("/health", protect, adminOnly, async (req, res) => {
  try {
    res.json(metricsService.getSystemHealth());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/metrics/api
 * API performance metrics (admin only).
 */
router.get("/api", protect, adminOnly, async (req, res) => {
  try {
    const [avgResponseTime, totalRequests, errorRate] = await Promise.all([
      metricsService.getAvgResponseTime(),
      metricsService.getTotalRequests(),
      metricsService.getErrorRate(),
    ]);
    res.json({ avgResponseTime, totalRequests, errorRate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/metrics/sla
 * SLA compliance status (admin only).
 */
router.get("/sla", protect, adminOnly, async (req, res) => {
  try {
    res.json(await metricsService.getSLAStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/metrics/all
 * All metrics combined (admin only).
 */
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    res.json(await metricsService.getAllMetrics());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /metrics
 * Prometheus-format metrics (for Grafana/Prometheus scraping).
 * NOTE: This endpoint is unauthenticated — protect at the network level if needed.
 */
router.get("/prometheus", async (req, res) => {
  try {
    res.set("Content-Type", promClient.register.contentType);
    res.send(await promClient.register.metrics());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
