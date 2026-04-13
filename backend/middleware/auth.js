/**
 * middleware/auth.js — Re-export of authMiddleware for the new module layout
 *
 * Provides:
 *   protect         — Require a valid JWT
 *   adminOnly        — Require admin role
 *   managerOrAdmin   — Require manager or admin role
 *   employeeOnly     — Require employee role
 */

export { protect, adminOnly, managerOrAdmin, employeeOnly } from "./authMiddleware.js";
