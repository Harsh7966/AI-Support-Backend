import express from "express";
import ticketsController from "../../controller/agentController.js/ticketController.js";
import { agentAuthMiddleware } from "../../middleware/authMiddleware.js";

const router= express.Router();

router.get("/getall-ticket", agentAuthMiddleware, ticketsController.getAllTicket);
router.get("/ticket-detail/:id", agentAuthMiddleware, ticketsController.getTicketDetails);
router.patch("/update-ticket/:id", agentAuthMiddleware, ticketsController.updateTicket);

export default router;