/**
 * middleware/requestLogger.js — Structured HTTP request/response logger
 *
 * Logs:
 *   - Method, URL, status, response time
 *   - IP address (x-forwarded-for aware)
 *   - User ID when authenticated
 *
 * Skips health-check endpoints to reduce noise.
 */

import logger from "../config/logging.js";

const SKIP_PATHS = ["/health", "/health/detailed", "/favicon.ico"];

export const requestLogger = (req, res, next) => {
  if (SKIP_PATHS.some((p) => req.path.startsWith(p))) return next();

  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const level    = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level](`${req.method} ${req.originalUrl}`, {
      status:   res.statusCode,
      ms:       duration,
      ip:       req.ip ?? req.headers["x-forwarded-for"] ?? "unknown",
      userId:   req.user?._id ?? undefined,
    });
  });

  next();
};

export default requestLogger;
