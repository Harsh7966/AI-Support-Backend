import express from "express";
import aiController from "../../controller/ai/aiController.js";
import { agentAuthMiddleware, adminAuthMiddleware, allowRoles } from "../../middleware/authMiddleware.js";
import { aiLimiter, agentToolsLimiter, adminAiLimiter } from "../../middleware/ai_rateLimiter.js";
import { aiContext } from "../../utils/aiContext.js";
import knowledgeRoute from "./knowledgeRoute.js";
import assistantRoute from "./assistantRoute.js";
const router= express.Router();

// Har route: pehle auth, phir rate limit, phir aiContext (log me feature/user naam ke liye), phir controller.
router.post("/chat", allowRoles("admin", "agent", "user"), aiLimiter, aiContext("chat"), aiController.chatReply);
router.post("/ticket-summary/:id", allowRoles("agent", "admin"), agentToolsLimiter, aiContext("ticket_summary"), aiController.getTicketSummary);
router.get("/generateDraft/:id", allowRoles("agent", "admin"), agentToolsLimiter, aiContext("suggested_reply"), aiController.generateDraft);
router.post("/index-tickets", adminAuthMiddleware, adminAiLimiter, aiContext("index_tickets"), aiController.indexTickets);
router.post("/similar-tickets", agentAuthMiddleware, agentToolsLimiter, aiContext("similar_tickets"), aiController.similarTickets);
router.post("/ask", agentAuthMiddleware, aiLimiter, aiContext("agent_ask"), aiController.askAssistant);

// Stage 10/11: knowledge base (admin) aur customer assistant
router.use("/knowledge", knowledgeRoute);
router.use("/assistant", assistantRoute);

export default router;
