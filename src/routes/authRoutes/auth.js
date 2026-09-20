import express from "express";
const router= express.Router();
import authController from "../../controller/authController/authController.js";

router.post("/auth", authController.loginSignupAuth);

export default router;