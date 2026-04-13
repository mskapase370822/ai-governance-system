import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// ── Generic factory ───────────────────────────────────────────────────────────
const makeLimiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });

// ── Per-IP general API limiter ────────────────────────────────────────────────
export const apiLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req) => ipKeyGenerator(req), // ✅ FIX
  message: { error: "Too many requests. Please slow down." },
});

// ── Per-user submission limiter ───────────────────────────────────────────────
export const submitLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) =>
    req.user?._id?.toString() || ipKeyGenerator(req), // ✅ FIX
  message: {
    error: "Too many submissions. Please wait before submitting again.",
  },
});

// ── Auth limiter ──────────────────────────────────────────────────────────────
export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => ipKeyGenerator(req), // ✅ FIX
  message: {
    error: "Too many authentication attempts. Try again in 15 minutes.",
  },
});

// ── Per API key limiter ───────────────────────────────────────────────────────
export const perApiKeyLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) =>
    req.headers["x-api-key"] || ipKeyGenerator(req), // ✅ FIX
  message: {
    error: "API key rate limit exceeded. Please retry after 1 minute.",
  },
  skip: (req) => !req.headers["x-api-key"],
});

export default {
  apiLimiter,
  submitLimiter,
  authLimiter,
  perApiKeyLimiter,
};