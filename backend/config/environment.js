/**
 * environment.js — Centralised environment variable management
 *
 * Reads and validates all environment variables in one place.
 * Throws at startup if required vars are missing in production.
 */

const env = process.env;

// ── Helpers ───────────────────────────────────────────────────────────────────

const required = (key) => {
  if (!env[key]) {
    if (env.NODE_ENV === "production") {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    console.warn(`⚠️  Missing env var: ${key} (non-fatal in development)`);
  }
  return env[key] ?? "";
};

const optional = (key, defaultValue = "") => env[key] ?? defaultValue;

// ── Exported config object ────────────────────────────────────────────────────

const config = {
  // Runtime
  nodeEnv:        optional("NODE_ENV", "development"),
  isProduction:   env.NODE_ENV === "production",
  port:           parseInt(optional("PORT", "5000"), 10),

  // Database
  mongoUri:       required("MONGO_URI"),

  // Auth
  jwtSecret:      required("JWT_SECRET"),
  jwtExpiresIn:   optional("JWT_EXPIRES_IN", "1d"),
  jwtRefreshSecret:  optional("JWT_REFRESH_SECRET", env.JWT_SECRET ?? ""),
  jwtRefreshExpiry:  optional("JWT_REFRESH_EXPIRES_IN", "7d"),

  // Encryption
  encryptionKey:  optional("ENCRYPTION_KEY", ""),

  // CORS
  frontendUrl:    optional("FRONTEND_URL", "http://localhost:5173"),

  // ML service
  mlServiceUrl:   optional("ML_SERVICE_URL", "http://localhost:8000"),

  // Email (optional)
  smtpHost:       optional("SMTP_HOST"),
  smtpPort:       parseInt(optional("SMTP_PORT", "587"), 10),
  smtpUser:       optional("SMTP_USER"),
  smtpPass:       optional("SMTP_PASS"),

  // Logging
  logLevel:       optional("LOG_LEVEL", "info"),
};

export default config;
