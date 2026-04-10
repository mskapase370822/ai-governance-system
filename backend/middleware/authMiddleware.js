import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Not authorized — no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch (err) {
    res.status(401).json({ error: "Token failed or expired" });
  }
};

// Case-insensitive role checks
export const adminOnly = (req, res, next) => {
  if ((req.user.role || "").toLowerCase() !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const managerOrAdmin = (req, res, next) => {
  const role = (req.user.role || "").toLowerCase();
  if (role !== "admin" && role !== "manager") {
    return res.status(403).json({ error: "Manager or Admin access required" });
  }
  next();
};
