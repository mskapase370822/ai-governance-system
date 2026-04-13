/**
 * RateLimiter.js — Per-user and per-API-key rate limiting
 *
 * Provides two limiters:
 *   perUserLimiter   — keyed on req.user._id (requires auth middleware first)
 *   perApiKeyLimiter — keyed on X-API-Key header
 *   authLimiter      — strict limiter for auth routes
 */

import rateLimit from "express-rate-limit";

// ── Generic factory ───────────────────────────────────────────────────────────

const makeLimiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders:   false,
    ...options,
  });

// ── Per-IP general API limiter (120 req / min) ────────────────────────────────
export const apiLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max:      120,
  message:  { error: "Too many requests. Please slow down." },
});

// ── Per-user submission limiter (30 submissions / min) ────────────────────────
export const submitLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max:      30,
  keyGenerator: (req) => req.user?._id?.toString() ?? req.ip,
  message:  { error: "Too many submissions. Please wait before submitting again." },
});

// ── Auth route limiter — prevent brute-force (10 attempts / 15 min) ───────────
export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { error: "Too many authentication attempts. Try again in 15 minutes." },
});

// ── Per-API-key limiter (100 req / min) ───────────────────────────────────────
export const perApiKeyLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max:      100,
  keyGenerator: (req) => req.headers["x-api-key"] ?? req.ip,
  message:  { error: "API key rate limit exceeded. Please retry after 1 minute." },
  skip:     (req) => !req.headers["x-api-key"],
});

export default { apiLimiter, submitLimiter, authLimiter, perApiKeyLimiter };
