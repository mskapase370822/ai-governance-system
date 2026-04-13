/**
 * app.js — Application factory (Express app + Socket.io setup)
 *
 * Imports config, middleware, routes and jobs, then exports the configured
 * Express app and HTTP server so server.js (entry point) can start them.
 *
 * This separation makes the app testable without starting a real server.
 */

import express        from "express";
import http           from "http";
import cors           from "cors";
import helmet         from "helmet";
import { Server }     from "socket.io";

import config          from "./config/environment.js";
import logger          from "./config/logging.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler }  from "./middleware/errorHandler.js";
import metricsMiddleware from "./middleware/metricsMiddleware.js";
import metricsRoutes     from "./routes/metricsRoutes.js";

// ── Legacy routes (v0 — backward-compat) ─────────────────────────────────────
import authRoutes      from "./routes/authRoutes.js";
import logRoutes       from "./routes/logRoutes.js";
import actionRoutes    from "./routes/actionRoutes.js";
import alertRoutes     from "./routes/alertRoutes.js";
import policyRoutes    from "./routes/policyRoutes.js";
import approvalRoutes  from "./routes/approvalRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import activityRoutes  from "./routes/activityRoutes.js";
import reportRoutes    from "./routes/reportRoutes.js";
import mlRoutes        from "./routes/mlRoutes.js";
import auditRoutes     from "./routes/auditRoutes.js";

// ── v1 routes ─────────────────────────────────────────────────────────────────
import healthRoute      from "./routes/health.js";
import v1PromptsRoute   from "./routes/v1/prompts.js";
import v1AlertsRoute    from "./routes/v1/alerts.js";
import v1PoliciesRoute  from "./routes/v1/policies.js";
import v1AnalyticsRoute from "./routes/v1/analytics.js";
import v1AdminRoute     from "./routes/v1/admin.js";

// ── Background jobs ───────────────────────────────────────────────────────────
import AlertProcessor       from "./jobs/AlertProcessor.js";
import AnalyticsAggregator  from "./jobs/AnalyticsAggregator.js";

// ── Build Express app ─────────────────────────────────────────────────────────

const app = express();

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = config.frontendUrl.split(",").map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json());

// Structured request logging (replaces Morgan for new routes)
app.use(requestLogger);

// Prometheus metrics
app.use(metricsMiddleware);

// ── Mount routes ──────────────────────────────────────────────────────────────

// Health
app.use("/health", healthRoute);

// v1 API
app.use("/api/v1/prompts",   v1PromptsRoute);
app.use("/api/v1/alerts",    v1AlertsRoute);
app.use("/api/v1/policies",  v1PoliciesRoute);
app.use("/api/v1/analytics", v1AnalyticsRoute);
app.use("/api/v1/admin",     v1AdminRoute);

// Legacy v0 API (unchanged for backward compatibility)
app.use("/api/auth",      authRoutes);
app.use("/api/logs",      logRoutes);
app.use("/api/actions",   actionRoutes);
app.use("/api/alerts",    alertRoutes);
app.use("/api/policies",  policyRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/activity",  activityRoutes);
app.use("/api/reports",   reportRoutes);
app.use("/api/metrics",   metricsRoutes);
app.use("/api/ml",        mlRoutes);
app.use("/api/audit",     auditRoutes);

// Root liveness
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "AI Governance Backend ✅", version: "1.0.0" });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Centralised error handler (must be last)
app.use(errorHandler);

// ── HTTP + WebSocket server ───────────────────────────────────────────────────

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

io.on("connection", (socket) => {
  logger.debug("WebSocket client connected", { id: socket.id });
  socket.on("disconnect", () => {
    logger.debug("WebSocket client disconnected", { id: socket.id });
  });
});

// Make io available in controllers via req.app.get("io")
app.set("io", io);

// ── Start background jobs ─────────────────────────────────────────────────────

export const startJobs = () => {
  AlertProcessor.start(io);
  AnalyticsAggregator.start(io);
};

export const stopJobs = () => {
  AlertProcessor.stop();
  AnalyticsAggregator.stop();
};

export { app, server, io };
export default app;
