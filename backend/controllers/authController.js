import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import { writeAuditLog } from "../utils/auditLogger.js";

// Normalize role to proper case
const normalizeRole = (role) => {
  const map = { admin: "Admin", employee: "Employee" };
  return map[(role || "").toLowerCase()] || "Employee";
};

export const registerUser = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedRole = normalizeRole(role);
    const user = await User.create({
      username,
      password: hashedPassword,
      role: normalizedRole,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    // Fix role if it was stored lowercase
    const role = normalizeRole(user.role);
    if (user.role !== role) {
      user.role = role;
      await user.save();
    }

    const token = generateToken(user._id, role, user.username);
    res.json({
      token,
      role,
      username: user.username,
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const role = normalizeRole(req.body.role);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    await writeAuditLog(req.user, "UPDATE_USER_ROLE", "User", user._id, { targetUsername: user.username, newRole: role }, req.ip);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
