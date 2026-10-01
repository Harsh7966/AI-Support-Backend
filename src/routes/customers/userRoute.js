import express from "express";
import ticketsController from "../../controller/customerController/ticketsController.js";
import { customerAuthMiddleware } from "../../middleware/authMiddleware.js";
import categoryController from "../../controller/customerController/categoryController.js";

const router= express.Router();

router.get("/all-category", customerAuthMiddleware, categoryController.getAllCategory);

router.post("/create-ticket", customerAuthMiddleware, ticketsController.createTicket);
router.get("/getall-ticket", customerAuthMiddleware, ticketsController.getAllTicket);
router.get("/ticket-detail/:id", customerAuthMiddleware, ticketsController.getTicketDetails);
router.patch("/update-ticket/:id", customerAuthMiddleware, ticketsController.updateTicket);

export default router;