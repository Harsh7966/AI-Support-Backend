import express from "express";
import ticketsController from "../../controller/customerController/ticketsController.js";

const router= express.Router();

router.post("/create-ticket", ticketsController.createTicket);
router.get("/getall-ticket", ticketsController.getAllTicket);
router.post("/ticket-detail", ticketsController.getTicketDetails);
router.post("/update-ticket", ticketsController.updateTicket);

export default router;