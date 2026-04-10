import promClient from "prom-client";

// Collect default Node.js metrics
promClient.collectDefaultMetrics({ prefix: "ai_governance_" });

export const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const httpRequestTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

/**
 * Middleware that measures request duration and counts total requests.
 */
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, String(res.statusCode))
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, String(res.statusCode))
      .inc();
  });

  next();
};

export default metricsMiddleware;
export { promClient };
