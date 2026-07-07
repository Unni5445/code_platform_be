import express from "express";
import UserController from "../controllers/user.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

/**
 * ================= AUTH ROUTES
 */
router.post("/sign-in", UserController.signinUser);
router.post("/sign-up", UserController.signupUser);
router.post("/google-auth", UserController.googleAuth);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/verify-otp", UserController.verifyOtp);
router.post("/reset-password", UserController.resetPassword);
router.post("/sign-out", protect, UserController.signOut);
router.get("/me", protect, UserController.getUserByToken);
router.patch("/me/onboarding", protect, UserController.completeOnboarding);
router.get("/me/stats", protect, UserController.getStudentStats);
router.get("/me/quests", protect, UserController.getDailyQuests);
router.post("/me/claim-xp", protect, UserController.claimXp);
router.post("/me/unlock-hint", protect, UserController.unlockHint);


/**
 * ================= USER CRUD ROUTES
 */
router
  .route("/users")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), UserController.getUsers)
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), UserController.createUser);

router
  .route("/users/bulk-import")
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), UserController.bulkImportUsers);

router.get("/users/export", protect, authorize("ADMIN", "SUPER_ADMIN"), UserController.exportUsers);

router
  .route("/users/:id")
  .get(protect, UserController.getUserById)
  .put(protect, UserController.updateUser)
  .delete(
    protect,
    authorize("ADMIN", "SUPER_ADMIN"),
    UserController.deleteUser
  );

router.post(
  "/users/admin/reset-password/:id",
  protect,
  authorize("SUPER_ADMIN"),
  UserController.adminResetPassword
);

/**
 * ================= SUBSCRIPTION ROUTES
 */
router
  .route("/subscription-tiers")
  .get(protect, UserController.getSubscriptionTiers)
  .post(protect, authorize("SUPER_ADMIN"), UserController.createSubscriptionTier);

router
  .route("/subscription-tiers/:id")
  .get(protect, UserController.getSubscriptionTierById)
  .put(protect, authorize("SUPER_ADMIN"), UserController.updateSubscriptionTier)
  .delete(protect, authorize("SUPER_ADMIN"), UserController.deleteSubscriptionTier);

router
  .route("/users/:id/subscription")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), UserController.getUserSubscription)
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"), UserController.updateUserSubscription);

export default router;
