/**
 * Metrics Service — collects API performance metrics using prom-client.
 * Exposes Prometheus-compatible metrics at GET /metrics
 * Also provides JSON endpoints for the frontend dashboard.
 */
import client from "prom-client";
import os from "os";

// Create a Registry to hold our metrics
export const registry = new client.Registry();

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
client.collectDefaultMetrics({ register: registry });

// ─── Custom metrics ────────────────────────────────────────────────────────

/** HTTP request duration histogram (seconds) */
export const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

/** Total HTTP requests counter */
export const httpRequests = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

/** HTTP error counter */
export const httpErrors = new client.Counter({
  name: "http_errors_total",
  help: "Total number of HTTP errors (4xx and 5xx)",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

/** Active concurrent requests gauge */
export const activeRequests = new client.Gauge({
  name: "http_active_requests",
  help: "Number of currently active HTTP requests",
  registers: [registry],
});

/** Risk analysis operations counter */
export const riskAnalysisCounter = new client.Counter({
  name: "risk_analysis_total",
  help: "Total risk analysis operations",
  labelNames: ["risk_level"],
  registers: [registry],
});

/** Email send counter */
export const emailSentCounter = new client.Counter({
  name: "emails_sent_total",
  help: "Total emails sent",
  labelNames: ["status"],
  registers: [registry],
});

// ─── In-memory rolling statistics ──────────────────────────────────────────

const recentRequests = []; // { ts: Date, duration: ms, route: string, status: number }
const WINDOW_MS = 60_000;  // 1 minute rolling window

export function recordRequest({ duration, route, status }) {
  recentRequests.push({ ts: Date.now(), duration, route, status });
  // Prune old entries
  const cutoff = Date.now() - WINDOW_MS;
  while (recentRequests.length && recentRequests[0].ts < cutoff) {
    recentRequests.shift();
  }
}

// ─── JSON metrics helpers (for frontend) ──────────────────────────────────

/** System-level metrics */
export function getSystemMetrics() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const uptimeSeconds = process.uptime();
  const uptimeHours = (uptimeSeconds / 3600).toFixed(2);

  return {
    cpu: {
      cores: cpus.length,
      model: cpus[0]?.model || "Unknown",
    },
    memory: {
      totalMB: Math.round(totalMem / 1024 / 1024),
      usedMB: Math.round(usedMem / 1024 / 1024),
      freeMB: Math.round(freeMem / 1024 / 1024),
      usagePercent: Math.round((usedMem / totalMem) * 100),
    },
    uptime: {
      seconds: Math.round(uptimeSeconds),
      hours: parseFloat(uptimeHours),
    },
    nodeVersion: process.version,
    platform: process.platform,
  };
}

/** API-level rolling metrics */
export function getAPIMetrics() {
  const now = Date.now();
  const window = recentRequests.filter((r) => now - r.ts <= WINDOW_MS);

  if (!window.length) {
    return {
      requestsPerMinute: 0,
      avgResponseMs: 0,
      minResponseMs: 0,
      maxResponseMs: 0,
      errorRatePercent: 0,
      totalRequests: recentRequests.length,
    };
  }

  const durations = window.map((r) => r.duration);
  const avgResponseMs = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const minResponseMs = Math.round(Math.min(...durations));
  const maxResponseMs = Math.round(Math.max(...durations));
  const errors = window.filter((r) => r.status >= 400).length;
  const errorRatePercent = parseFloat(((errors / window.length) * 100).toFixed(2));

  return {
    requestsPerMinute: window.length,
    avgResponseMs,
    minResponseMs,
    maxResponseMs,
    errorRatePercent,
    totalRequests: recentRequests.length,
  };
}

/** SLA compliance metrics */
export function getSLAMetrics() {
  const slaTargetMs = parseInt(process.env.SLA_TARGET_MS) || 500;
  const slaTargetPercent = parseFloat(process.env.SLA_TARGET_PERCENT) || 99.5;

  if (!recentRequests.length) {
    return {
      slaTargetMs,
      slaTargetPercent,
      slaCompliancePercent: 100,
      status: "healthy",
    };
  }

  const compliant = recentRequests.filter((r) => r.duration <= slaTargetMs).length;
  const slaCompliancePercent = parseFloat(((compliant / recentRequests.length) * 100).toFixed(2));

  const status =
    slaCompliancePercent >= slaTargetPercent ? "healthy" :
    slaCompliancePercent >= slaTargetPercent - 2 ? "warning" : "critical";

  return { slaTargetMs, slaTargetPercent, slaCompliancePercent, status };
}

/** Aggregated performance health */
export function getPerformanceHealth() {
  const system = getSystemMetrics();
  const api = getAPIMetrics();
  const sla = getSLAMetrics();

  const memStatus = system.memory.usagePercent > 90 ? "critical" : system.memory.usagePercent > 75 ? "warning" : "healthy";
  const apiStatus = api.avgResponseMs > 1000 ? "critical" : api.avgResponseMs > 500 ? "warning" : "healthy";
  const errStatus = api.errorRatePercent > 10 ? "critical" : api.errorRatePercent > 5 ? "warning" : "healthy";

  const statuses = [memStatus, apiStatus, errStatus, sla.status];
  const overallStatus =
    statuses.includes("critical") ? "critical" :
    statuses.includes("warning") ? "warning" : "healthy";

  return {
    overall: overallStatus,
    components: {
      memory: memStatus,
      api: apiStatus,
      errors: errStatus,
      sla: sla.status,
    },
    system,
    api,
    sla,
    timestamp: new Date().toISOString(),
  };
}
