import express from "express";
import QuestionController from "../controllers/question.controller";
import { protect } from "../middlewares/authProtect";

const router = express.Router();

// Basic CRUD routes
router
  .route("/questions")
  .get(QuestionController.getAllQuestion)
  .post(protect, QuestionController.createQuestion);

router
  .route("/questions/:id")
  .get(QuestionController.getQuestion)
  .put(protect, QuestionController.updateQuestion)
  .delete(protect, QuestionController.deleteQuestion);

// LeetCode-style routes
// Get question by slug (e.g., /questions/slug/two-sum)
router
  .route("/questions/slug/:slug")
  .get(QuestionController.getQuestionBySlug);

// Get questions by difficulty (e.g., /questions/difficulty/easy)
router
  .route("/questions/difficulty/:difficulty")
  .get(QuestionController.getQuestionsByDifficulty);

// Get questions by topic (e.g., /questions/topic/array)
router
  .route("/questions/topic/:topic")
  .get(QuestionController.getQuestionsByTopic);

// Get questions by company (e.g., /questions/company/google)
router
  .route("/questions/company/:company")
  .get(QuestionController.getQuestionsByCompany);

// Get popular questions
router
  .route("/questions/popular")
  .get(QuestionController.getPopularQuestions);

// Get questions sorted by acceptance rate
router
  .route("/questions/acceptance-rate")
  .get(QuestionController.getQuestionsByAcceptanceRate);

// Get all topics
router
  .route("/questions/meta/topics")
  .get(QuestionController.getAllTopics);

// Get all companies
router
  .route("/questions/meta/companies")
  .get(QuestionController.getAllCompanies);

// Get hints for a question
router
  .route("/questions/:id/hints")
  .get(QuestionController.getHints);

// Get editorial for a question
router
  .route("/questions/:id/editorial")
  .get(QuestionController.getEditorial);

// Update question statistics
router
  .route("/questions/:id/statistics")
  .post(protect, QuestionController.updateStatistics);

// Get similar problems
router
  .route("/questions/:id/similar")
  .get(QuestionController.getSimilarProblems);

export default router;
