import express from "express";
import aiController from "../../controller/ai/aiController.js";
const router= express.Router();

router.post("/chat", aiController.chatReply);
router.post("/ticket-summary/:id", aiController.getTicketSummary);
router.get("/generateDraft/:id", aiController.generateDraft)

export default router;