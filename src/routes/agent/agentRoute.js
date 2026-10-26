import express from "express";
import ticketsController from "../../controller/agentController.js/ticketController.js";
import messageController from "../../controller/agentController.js/messageController.js";
import { agentAuthMiddleware } from "../../middleware/authMiddleware.js";
import authController from "../../controller/authController/authController.js";

const router= express.Router();

router.get("/profile", agentAuthMiddleware, authController.userProfile);

router.get("/getall-ticket", agentAuthMiddleware, ticketsController.getAllTicket);
router.get("/ticket-detail/:id", agentAuthMiddleware, ticketsController.getTicketDetails);
router.patch("/update-ticket/:id", agentAuthMiddleware, ticketsController.updateTicket);
router.get("/messages/:ticketId", agentAuthMiddleware, messageController.getMessages);
router.get("/agent-dashboard", agentAuthMiddleware, ticketsController.agentDashboardInfo);

export default router;