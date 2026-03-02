import express from "express";
import TestController from "../controllers/test.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/tests")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), TestController.getTests)
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), TestController.createTest);

router
  .route("/tests/:id")
  .get(protect, TestController.getTestById)
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"), TestController.updateTest)
  .delete(protect, authorize("SUPER_ADMIN"), TestController.deleteTest);

export default router;
