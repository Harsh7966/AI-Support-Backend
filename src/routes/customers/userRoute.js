import express from "express";
import ticketsController from "../../controller/customerController/ticketsController.js";
import { customerAuthMiddleware } from "../../middleware/authMiddleware.js";
import messageController from "../../controller/customerController/messageController.js";
import categoryController from "../../controller/customerController/categoryController.js";
import { aiLimiter } from "../../middleware/ai_rateLimiter.js";
import authController from "../../controller/authController/authController.js";

const router= express.Router();

router.get("/all-category", customerAuthMiddleware, categoryController.getAllCategory);
router.get("/profile", customerAuthMiddleware, authController.userProfile);
router.post("/create-ticket", customerAuthMiddleware, aiLimiter, ticketsController.createTicket);
router.get("/getall-ticket", customerAuthMiddleware, ticketsController.getAllTicket);
router.get("/ticket-detail/:id", customerAuthMiddleware, ticketsController.getTicketDetails);
router.patch("/update-ticket/:id", customerAuthMiddleware, ticketsController.updateTicket);
router.get("/messages/:ticketId", customerAuthMiddleware, messageController.getMessages);

export default router;