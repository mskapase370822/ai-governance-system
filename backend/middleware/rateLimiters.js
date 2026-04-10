import rateLimit from "express-rate-limit";

/**
 * General API rate limiter — applied to read-heavy admin endpoints.
 * 120 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again." },
});

/**
 * Strict write limiter — for activity submissions.
 * 30 submissions per minute per IP.
 */
export const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many activity submissions. Please wait before submitting again." },
});
