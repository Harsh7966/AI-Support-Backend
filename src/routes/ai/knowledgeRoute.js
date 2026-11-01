import express from "express";
import knowledgeController from "../../controller/ai/knowledgeController.js";
import { adminAuthMiddleware } from "../../middleware/authMiddleware.js";
import { adminAiLimiter } from "../../middleware/ai_rateLimiter.js";
import { aiContext } from "../../utils/aiContext.js";
const router = express.Router();

// Sab sirf admin ke liye. Jo route embedding (paisa kharch) karta hai us par limit bhi.
router.get("/", adminAuthMiddleware, knowledgeController.list);
router.post("/", adminAuthMiddleware, adminAiLimiter, aiContext("knowledge_add"), knowledgeController.create);
router.post("/reindex", adminAuthMiddleware, adminAiLimiter, aiContext("knowledge_reindex"), knowledgeController.reindex);
router.patch("/:id", adminAuthMiddleware, adminAiLimiter, aiContext("knowledge_update"), knowledgeController.update);
router.delete("/:id", adminAuthMiddleware, knowledgeController.remove);

export default router;
