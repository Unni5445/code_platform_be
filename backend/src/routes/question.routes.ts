import express from "express";
import QuestionController from "../controllers/question.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/questions")
  .get(protect, authorize("ADMIN", "SUPER_ADMIN"), QuestionController.getQuestions)
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), QuestionController.createQuestion);

router
  .route("/questions/bulk-import")
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), QuestionController.bulkImportQuestions);

router
  .route("/questions/:id")
  .get(protect, QuestionController.getQuestionById)
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"), QuestionController.updateQuestion)
  .delete(protect, authorize("SUPER_ADMIN"), QuestionController.deleteQuestion);

export default router;
