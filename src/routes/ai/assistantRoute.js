import express from "express";
import assistantController from "../../controller/ai/assistantController.js";
import { customerAuthMiddleware } from "../../middleware/authMiddleware.js";
import { assistantLimiter } from "../../middleware/ai_rateLimiter.js";
import { aiContext } from "../../utils/aiContext.js";
const router = express.Router();

// POST /api/v1/ai/assistant  (sirf customer, rate limited)
router.post("/", customerAuthMiddleware, assistantLimiter, aiContext("customer_assistant"), assistantController.ask);

export default router;
