/**
 * server.js — Application entry point
 */

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

// ── Validate required environment variables ──────────────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);

if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  console.error("   Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

// ── Import app (after env vars are loaded) ───────────────────────────────────
import { server, startJobs, stopJobs } from "./app.js";
import scheduledReports from "./services/scheduledReports.js";
import riskModel from "./ml/riskModel.js";

const isProduction = process.env.NODE_ENV === "production";

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} [${
      isProduction ? "production" : "development"
    }]`
  );

  // Start scheduled reports
  scheduledReports.startScheduler();

  // Initialize ML model
  riskModel._seedWeights();
  console.log("🤖 ML risk model initialized");

  // Start background jobs
  startJobs();
  console.log("⚙️  Background jobs started");
});

// ── Graceful shutdown (FIXED VERSION) ─────────────────────────────────────────
let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) return; // ✅ prevent multiple execution
  isShuttingDown = true;

  console.log(`\n${signal} received — shutting down gracefully...`);

  try {
    // Stop background jobs
    await stopJobs();

    // Stop scheduled reports (if available)
    if (scheduledReports?.stopScheduler) {
      await scheduledReports.stopScheduler();
      console.log("🛑 Scheduled reports stopped");
    }

    // Close HTTP server
    await new Promise((resolve) => {
      server.close(() => {
        console.log("🛑 HTTP server closed");
        resolve();
      });
    });

    // Close MongoDB
    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed");

    console.log("✅ Shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Shutdown error:", err);
    process.exit(1);
  }
};

// ✅ Register listeners ONLY ONCE (prevents memory leak)
if (!process.listenerCount("SIGINT")) {
  process.on("SIGINT", () => shutdown("SIGINT"));
}

if (!process.listenerCount("SIGTERM")) {
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// ⚠️ Force shutdown if something hangs (safety)
setTimeout(() => {
  if (isShuttingDown) {
    console.error("⚠️ Forced shutdown after timeout");
    process.exit(1);
  }
}, 10000);