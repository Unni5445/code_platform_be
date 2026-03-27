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

router
  .route("/tests/:id/questions")
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), TestController.addQuestions);

router
  .route("/tests/:id/questions/:questionId")
  .delete(protect, authorize("ADMIN", "SUPER_ADMIN"), TestController.removeQuestion);

router
  .route("/tests/:id/submissions")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), TestController.getTestSubmissions);

router
  .route("/tests/submissions/:id")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), TestController.getTestSubmission);

export default router;
