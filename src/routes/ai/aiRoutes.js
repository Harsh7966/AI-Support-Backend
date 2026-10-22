import express from "express";
import aiController from "../../controller/ai/aiController.js";
import { agentAuthMiddleware, adminAuthMiddleware } from "../../middleware/authMiddleware.js";
import { aiLimiter } from "../../middleware/ai_rateLimiter.js";
const router= express.Router();

router.post("/chat", aiController.chatReply);
router.post("/ticket-summary/:id", aiController.getTicketSummary);
router.get("/generateDraft/:id", aiController.generateDraft)
router.post("/index-tickets", adminAuthMiddleware, aiController.indexTickets);
router.post("/similar-tickets", agentAuthMiddleware, aiController.similarTickets);
router.post("/ask", agentAuthMiddleware, aiLimiter, aiController.askAssistant);

export default router;