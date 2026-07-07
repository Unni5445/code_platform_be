import Razorpay from "razorpay";
import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ErrorResponse from "../utils/errorResponse";
import ApiResponse from "../utils/ApiResponse";
import SubscriptionTier from "../models/subscriptionTier.model";
import Subscription from "../models/subscription.model";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkeyid12345",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mockkeysecret12345",
});

class PaymentController {
  // ==================== CREATE RAZORPAY ORDER ====================
  static createOrder = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { tierId } = req.body;
      if (!tierId) {
        return next(new ErrorResponse("Subscription tier ID is required", 400));
      }

      const tier = await SubscriptionTier.findOne({ _id: tierId, isDeleted: false });
      if (!tier) {
        return next(new ErrorResponse("Subscription tier not found", 404));
      }

      if (tier.price <= 0) {
        return next(new ErrorResponse("This tier is free and does not require payment", 400));
      }

      const options = {
        amount: Math.round(tier.price * 100), // amount in paisa
        currency: tier.currency || "INR",
        receipt: `receipt_student_sub_${req.user!._id}_${Date.now().toString(36)}`,
      };

      try {
        const order = await razorpay.orders.create(options);
        res.status(201).json(
          new ApiResponse(
            201,
            {
              orderId: order.id,
              amount: order.amount,
              currency: order.currency,
              tierName: tier.name,
              keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkeyid12345",
            },
            "Razorpay order created successfully"
          )
        );
      } catch (error: any) {
        return next(new ErrorResponse(error.message || "Failed to create Razorpay order", 500));
      }
    }
  );

  // ==================== VERIFY RAZORPAY SIGNATURE & ACTIVATE SUB ====================
  static verifyPayment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tierId } = req.body;
      const studentId = req.user!._id;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !tierId) {
        return next(new ErrorResponse("All payment credentials and tier ID are required", 400));
      }

      const tier = await SubscriptionTier.findOne({ _id: tierId, isDeleted: false });
      if (!tier) {
        return next(new ErrorResponse("Subscription tier not found", 404));
      }

      // Cryptographic signature verification
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mockkeysecret12345")
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return next(new ErrorResponse("Payment signature verification failed. Potential tampering detected.", 400));
      }

      // Activate/update student's individual subscription for 30 days
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      const subscription = await Subscription.findOneAndUpdate(
        { student: studentId },
        {
          status: "ACTIVE",
          tier: tierId,
          expiresAt,
        },
        { upsert: true, new: true }
      ).populate("tier");

      res.status(200).json(
        new ApiResponse(
          200,
          subscription,
          `Subscription tier ${tier.name} successfully activated until ${expiresAt.toLocaleDateString()}`
        )
      );
    }
  );
}

export default PaymentController;
