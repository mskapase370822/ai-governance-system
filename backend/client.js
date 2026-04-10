import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // backend port

socket.on("connect", () => {
  console.log("✅ Connected to backend WebSocket");
});

socket.on("risky_log_detected", (alert) => {
  console.log("⚠️ Alert received:", alert);
});
