import express from "express";
import UserController from "../controllers/user.controller";
import UserAuthController from "../controllers/userAuth.controller";
import { protect } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/users")
  .get(UserController.getAllUser)
  .post(UserController.createUser);
router.route("/sign-in").post(UserAuthController.signinUser);
router.route("/sign-out").post(UserAuthController.signOut);
router
  .route("/reset-password")
  .patch(protect, UserAuthController.resetPassword);
router.route("/get-user").post(protect, UserAuthController.getUserByToken);

export default router;
