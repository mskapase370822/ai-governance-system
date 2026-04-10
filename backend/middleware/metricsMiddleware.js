/**
 * Metrics Middleware — captures response time and records it in metricsService.
 */
import {
  httpDuration,
  httpRequests,
  httpErrors,
  activeRequests,
  recordRequest,
} from "../services/metricsService.js";

/**
 * Express middleware to track request/response metrics.
 */
export function metricsMiddleware(req, res, next) {
  const startHrTime = process.hrtime.bigint();
  activeRequests.inc();

  res.on("finish", () => {
    const durationNs = process.hrtime.bigint() - startHrTime;
    const durationSeconds = Number(durationNs) / 1e9;
    const durationMs = durationSeconds * 1000;

    // Normalise route — strip IDs to avoid high cardinality
    const route = (req.route?.path || req.path || "unknown")
      .replace(/\/[a-f0-9]{24}/g, "/:id")   // ObjectIds
      .replace(/\/\d+/g, "/:n");             // numeric IDs

    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    httpDuration.observe(labels, durationSeconds);
    httpRequests.inc(labels);

    if (res.statusCode >= 400) {
      httpErrors.inc(labels);
    }

    activeRequests.dec();

    recordRequest({
      duration: durationMs,
      route,
      status: res.statusCode,
    });
  });

  next();
}
