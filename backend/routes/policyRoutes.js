import express from "express";
import {
  getPolicies, getPolicy, createPolicy,
  updatePolicy, togglePolicy, deletePolicy,
} from "../controllers/policyController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getPolicies);
router.get("/:id", protect, getPolicy);
router.post("/", protect, adminOnly, createPolicy);
router.put("/:id", protect, adminOnly, updatePolicy);
router.put("/:id/toggle", protect, adminOnly, togglePolicy);
router.delete("/:id", protect, adminOnly, deletePolicy);

export default router;
