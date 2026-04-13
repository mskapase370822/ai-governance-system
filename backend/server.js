/**
 * server.js — Application entry point
 *
 * Responsibilities:
 *   1. Load environment variables
 *   2. Connect to MongoDB
 *   3. Import and start the Express app + Socket.io server from app.js
 *   4. Start background jobs
 *   5. Handle graceful shutdown
 *
 * Application structure and routing is defined in app.js.
 */

import dotenv    from "dotenv";
import mongoose  from "mongoose";

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
import riskModel        from "./ml/riskModel.js";

const isProduction = process.env.NODE_ENV === "production";

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${isProduction ? "production" : "development"}]`);

  // Start legacy scheduled reports
  scheduledReports.startScheduler();

  // Seed ML model weights
  riskModel._seedWeights();
  console.log("🤖 ML risk model initialized");

  // Start background jobs (AlertProcessor, AnalyticsAggregator)
  startJobs();
  console.log("⚙️  Background jobs started");
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  stopJobs();
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
