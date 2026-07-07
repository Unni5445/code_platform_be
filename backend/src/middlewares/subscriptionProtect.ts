import { Request, Response, NextFunction } from "express";
import Subscription from "../models/subscription.model";
import SubscriptionTier from "../models/subscriptionTier.model";
import ErrorResponse from "../utils/errorResponse";

export const checkSubscription = (requiredFeature: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ErrorResponse("Unauthorized access", 401));
      }

      // Admins and Super Admins bypass subscription validations
      if (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN") {
        return next();
      }

      if (req.user.role === "STUDENT") {
        let subscription = await Subscription.findOne({ student: req.user._id })
          .populate<{ tier: any }>("tier");

        // Auto-grant PREMIUM subscription dynamically if they belong to default student organisation
        if (!subscription && req.user.organisation?.toString() === "69a4771afb503d57808b866e") {
          const premiumTier = await SubscriptionTier.findOne({ name: "PREMIUM" });
          if (premiumTier) {
            subscription = await Subscription.create({
              student: req.user._id,
              status: "ACTIVE",
              tier: premiumTier._id,
            });
            // Re-populate
            subscription = await Subscription.findById(subscription._id).populate<{ tier: any }>("tier");
          }
        }

        if (!subscription) {
          return next(new ErrorResponse("Access denied. You do not have an active subscription for this product. Please contact your administrator.", 403));
        }

        // Auto-expire check
        if (subscription.status === "ACTIVE" && subscription.expiresAt && new Date() > subscription.expiresAt) {
          subscription.status = "EXPIRED";
          await subscription.save();
        }

        if (subscription.status !== "ACTIVE") {
          return next(
            new ErrorResponse(
              `Access denied. Your subscription is ${subscription.status.toLowerCase()}. Please contact your administrator.`,
              403
            )
          );
        }

        const tier = subscription.tier;
        if (!tier || !tier.features.includes(requiredFeature)) {
          return next(
            new ErrorResponse(
              `Access denied. Your subscription tier (${tier?.name || "NONE"}) does not cover this feature. Please contact your administrator to upgrade.`,
              403
            )
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
