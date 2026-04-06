import express from "express";
import InterviewController from "../controllers/interview.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student routes
router.get("/interviews", InterviewController.getInterviews);
router.get("/interviews/stats", InterviewController.getStats);
router.get("/interviews/:id", InterviewController.getInterviewById);
router.post("/interviews/:id/attempt", InterviewController.submitAttempt);

// Admin routes
router.get("/admin/interviews", authorize("ADMIN", "SUPER_ADMIN"), InterviewController.getAdminInterviews);
router.post("/admin/interviews", authorize("ADMIN", "SUPER_ADMIN"), InterviewController.createInterview);
router.get("/admin/interviews/:id/attempts", authorize("ADMIN", "SUPER_ADMIN"), InterviewController.getInterviewAttempts);
router.put("/admin/interviews/:id", authorize("ADMIN", "SUPER_ADMIN"), InterviewController.updateInterview);
router.delete("/admin/interviews/:id", authorize("ADMIN", "SUPER_ADMIN"), InterviewController.deleteInterview);

export default router;
