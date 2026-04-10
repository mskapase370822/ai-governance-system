import express from "express";
import rateLimit from "express-rate-limit";
import { body } from "express-validator";
import { registerUser, loginUser, getUsers, updateUserRole } from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { apiLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

// Rate limit: max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

// Rate limit: max 5 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please try again in an hour." },
});

// Validation rules for registration
const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage("Username may only contain letters, numbers, underscores, dots, and hyphens"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),
];

router.post("/register", registerLimiter, registerValidation, validateRequest, registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/users", apiLimiter, protect, adminOnly, getUsers);
router.put("/users/:id/role", apiLimiter, protect, adminOnly, updateUserRole);

export default router;
