import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import actionRoutes from "./routes/actionRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import policyRoutes from "./routes/policyRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Create HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// WebSocket connections
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Make io available in controllers
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/actions", actionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "AI Governance Backend is running ✅" });
});

// Centralized error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
