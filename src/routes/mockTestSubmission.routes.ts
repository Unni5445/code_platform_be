import express from "express";
import MockTestSubmissionController from "../controllers/mockTestSubmission.controller";
import { protect } from "../middlewares/authProtect";

const router = express.Router();

router
  .route("/submissions")
  .get(MockTestSubmissionController.getAllMockTestSubmission)
  .post(MockTestSubmissionController.createMockTestSubmission);
router
  .route("/submissions/:id")
  .get(MockTestSubmissionController.getMockTestSubmission)
  .put(MockTestSubmissionController.updateMockTestSubmission)
  .delete(MockTestSubmissionController.deleteMockTestSubmission);

export default router;
