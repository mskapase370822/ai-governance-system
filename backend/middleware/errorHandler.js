/**
 * middleware/errorHandler.js — Centralised Express error handler
 *
 * Catches errors thrown/forwarded with next(err) and returns a consistent
 * JSON response.  Must be registered AFTER all routes.
 */

import config from "../config/environment.js";
import logger  from "../config/logging.js";

/**
 * @param {Error}    err
 * @param {Request}  req
 * @param {Response} res
 * @param {Function} next  — required 4-arg signature for Express to recognise as error handler
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Determine status code
  const status = err.status ?? err.statusCode ?? 500;

  // Log the error (full stack in dev, message only in prod)
  if (status >= 500) {
    logger.error("Unhandled error", {
      method:  req.method,
      url:     req.originalUrl,
      status,
      error:   err.message,
      stack:   config.isProduction ? undefined : err.stack,
    });
  }

  // Never expose stack traces or internal messages in production
  const message = config.isProduction && status === 500
    ? "Internal server error"
    : err.message;

  res.status(status).json({ error: message });
};

export default errorHandler;
