import express from "express";
import UserController from "../controllers/user.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

/**
 * ================= AUTH ROUTES
 */
router.post("/sign-in", UserController.signinUser);
router.post("/sign-out", protect, UserController.signOut);
router.get("/me", protect, UserController.getUserByToken);

/**
 * ================= USER CRUD ROUTES
 */
router
  .route("/users")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), UserController.getUsers)
  .post(protect, authorize("SUPER_ADMIN"), UserController.createUser);

router
  .route("/users/:id")
  .get(protect, UserController.getUserById)
  .put(protect, UserController.updateUser)
  .delete(
    protect,
    authorize("SUPER_ADMIN"),
    UserController.deleteUser
  );


export default router;
