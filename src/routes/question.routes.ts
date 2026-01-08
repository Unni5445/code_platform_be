import express from "express";
import QuestionController from "../controllers/question.controller";
import { protect } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/questions")
  .get(QuestionController.getAllQuestion)
  .post(QuestionController.createQuestion);
router
  .route("/questions/:id")
  .get(QuestionController.getQuestion)
  .put(QuestionController.updateQuestion)
  .delete(QuestionController.deleteQuestion);

export default router;
