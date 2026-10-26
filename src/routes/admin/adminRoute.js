import express from "express";
import customerController from "../../controller/adminController/customerController.js";
import categoryController from "../../controller/adminController/categoryController.js";
import agentController from "../../controller/adminController/agentController.js";
import ticketsController from "../../controller/adminController/ticketController.js";
import authController from "../../controller/authController/authController.js";
import { adminAuthMiddleware } from "../../middleware/authMiddleware.js";
const router= express.Router();

router.get("/profile", adminAuthMiddleware, authController.userProfile);

// Customers route
router.get("/all-customer", adminAuthMiddleware, customerController.getAllCustomers);
router.get("/customer-by-id/:id", adminAuthMiddleware, customerController.getCustomerById);
router.patch("/update-customer/:id", adminAuthMiddleware, customerController.updateCustomer);

// Category route
router.post("/create-category", adminAuthMiddleware, categoryController.createCategory);
router.get("/all-category", adminAuthMiddleware, categoryController.getAllCategory);
router.get("/category-details/:id", adminAuthMiddleware, categoryController.getCategoryDetails);
router.patch("/update-category/:id", adminAuthMiddleware, categoryController.updateCategory);

// Agent route
router.post("/create-agent", adminAuthMiddleware, agentController.createAgent);
router.get("/all-agents", adminAuthMiddleware, agentController.getAllAgent);
router.get("/agent-details/:id", adminAuthMiddleware, agentController.getAgentDetails);
router.patch("/update-agent/:id", adminAuthMiddleware, agentController.updateAgent);

// Ticket route
router.get("/getall-ticket", adminAuthMiddleware, ticketsController.getAllTicket);
router.get("/ticket-detail/:id", adminAuthMiddleware, ticketsController.getTicketDetails);
router.patch("/update-ticket/:id", adminAuthMiddleware, ticketsController.updateTicket);

export default router;