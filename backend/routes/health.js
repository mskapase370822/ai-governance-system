/**
 * routes/health.js — Health check endpoint
 *
 * GET /health          — Basic liveness check
 * GET /health/detailed — System readiness (DB, memory)
 */

import express from "express";
import mongoose from "mongoose";
import os from "os";

const router = express.Router();

// GET /health — liveness
router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "ai-governance-backend",
    timestamp: new Date().toISOString(),
  });
});

// GET /health/detailed — readiness
router.get("/detailed", async (req, res) => {
  const dbState  = mongoose.connection.readyState; // 0=disconnected, 1=connected
  const dbOk     = dbState === 1;

  const memUsage = process.memoryUsage();
  const uptime   = process.uptime();

  const status = dbOk ? "healthy" : "degraded";

  res.status(dbOk ? 200 : 503).json({
    status,
    timestamp:  new Date().toISOString(),
    uptime:     `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    database: {
      connected: dbOk,
      state:     ["disconnected", "connected", "connecting", "disconnecting"][dbState] ?? "unknown",
    },
    memory: {
      heapUsed:  `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
      rss:       `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    },
    system: {
      platform: os.platform(),
      nodeVersion: process.version,
      cpus:        os.cpus().length,
    },
  });
});

export default router;
