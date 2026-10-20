import express from "express";
import aiController from "../../controller/ai/aiController.js";
import { agentAuthMiddleware, adminAuthMiddleware } from "../../middleware/authMiddleware.js";
const router= express.Router();

router.post("/chat", aiController.chatReply);
router.post("/ticket-summary/:id", aiController.getTicketSummary);
router.get("/generateDraft/:id", aiController.generateDraft)
router.post("/index-tickets", adminAuthMiddleware, aiController.indexTickets);
router.post("/similar-tickets", agentAuthMiddleware, aiController.similarTickets);

export default router;