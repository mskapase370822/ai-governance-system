/**
 * Metrics Routes
 * GET /api/metrics/system      — CPU, memory, uptime
 * GET /api/metrics/api         — Response times, error rates
 * GET /api/metrics/sla         — SLA compliance
 * GET /api/metrics/performance — Overall health dashboard
 */
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getSystemMetrics,
  getAPIMetrics,
  getSLAMetrics,
  getPerformanceHealth,
  registry,
} from "../services/metricsService.js";

const router = express.Router();

router.get("/system", protect, adminOnly, (req, res) => {
  res.json(getSystemMetrics());
});

router.get("/api", protect, adminOnly, (req, res) => {
  res.json(getAPIMetrics());
});

router.get("/sla", protect, adminOnly, (req, res) => {
  res.json(getSLAMetrics());
});

router.get("/performance", protect, adminOnly, (req, res) => {
  res.json(getPerformanceHealth());
});

/**
 * GET /metrics — Prometheus scrape endpoint (no auth — typically internal only)
 * Mount separately from /api/metrics to keep the path standard.
 */
export const prometheusHandler = async (req, res) => {
  try {
    res.set("Content-Type", registry.contentType);
    res.end(await registry.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
};

export default router;
