import express from "express";
import { submitAction, confirmAction } from "../controllers/actionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/submit", protect, submitAction);
router.put("/confirm/:logId", protect, confirmAction);

export default router;
