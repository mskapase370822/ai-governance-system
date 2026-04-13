import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import actionRoutes from "./routes/actionRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";

import metricsMiddleware from "./middleware/metricsMiddleware.js";
import scheduledReports from "./services/scheduledReports.js";
import riskModel from "./ml/riskModel.js";

dotenv.config();

// ── Validate required environment variables ──────────────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  console.error("   Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(isProduction ? "combined" : "dev"));

app.use(express.json());
app.use(metricsMiddleware);

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ── Create HTTP + WebSocket server ────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Make io available in controllers
app.set("io", io);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/actions", actionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/audit", auditRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "AI Governance Backend is running ✅" });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Centralized error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: isProduction ? "Internal server error" : err.message });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${isProduction ? "production" : "development"}]`);

  scheduledReports.startScheduler();

  riskModel._seedWeights();
  console.log("🤖 ML risk model initialized");
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log("🛑 HTTP server closed");
    mongoose.connection.close().then(() => {
      console.log("🛑 MongoDB connection closed");
      process.exit(0);
    });
  });
  // Force exit if shutdown takes too long
  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
