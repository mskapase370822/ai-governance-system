import express from "express";
import { registerUser, loginUser, getUsers, updateUserRole } from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", protect, adminOnly, getUsers);
router.put("/users/:id/role", protect, adminOnly, updateUserRole);

export default router;
