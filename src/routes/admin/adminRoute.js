import express from "express";
import customerController from "../../controller/adminController/customerController.js";
import categoryController from "../../controller/adminController/categoryController.js";
import agentController from "../../controller/adminController/agentController.js";
const router= express.Router();

// Customers route
router.get("/all-customer", customerController.getAllCustomers);
router.get("/customer-by-id/:id", customerController.getCustomerById);
router.patch("/update-customer/:id", customerController.updateCustomer);

// Category route
router.post("/create-category", categoryController.createCategory);
router.get("/all-category", categoryController.getAllCategory);
router.get("/category-details/:id", categoryController.getCategoryDetails);
router.patch("/update-category/:id", categoryController.updateCategory);

// Agent route
router.post("/create-agent", agentController.createAgent);
router.get("/all-agents", agentController.getAllAgent);
router.get("/agent-details/:id", agentController.getAgentDetails);
router.patch("/update-agent/:id", agentController.updateAgent);

export default router;