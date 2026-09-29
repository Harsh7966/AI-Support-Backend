import express from "express";
import customers from "../../controller/adminController/customerController.js"
const router= express.Router();

//Customer routes
router.get("/all-customers", customers.AllCustomers);
router.patch("/update-customer/:id", customers.UpadteCustomer);

export default router;