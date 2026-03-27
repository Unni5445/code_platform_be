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


export default router;
