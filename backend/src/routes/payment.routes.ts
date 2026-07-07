import express from "express";
import PaymentController from "../controllers/payment.controller";
import { protect } from "../middlewares/authProtect";

const router = express.Router();

// All payment routes require student authentication
router.post("/payments/create-order", protect, PaymentController.createOrder);
router.post("/payments/verify-payment", protect, PaymentController.verifyPayment);

export default router;
