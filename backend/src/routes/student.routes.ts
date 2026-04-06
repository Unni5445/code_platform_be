import express from "express";
import StudentController from "../controllers/student.controller";
import { protect } from "../middlewares/authProtect";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Test operations
router.post("/tests/:id/start", StudentController.startTest);
router.post("/tests/:id/submit", StudentController.submitTest);
router.get("/submissions/:id", StudentController.getTestSubmission);

// Code execution
router.post("/code/execute", StudentController.executeCode);
router.post("/questions/:id/run-tests", StudentController.runTestCases);

// Get batches available for a course
router.get("/courses/:courseId/batches", StudentController.getCourseBatches);

// Self-enroll in a course (batch-based)
router.post("/courses/:courseId/self-enroll", StudentController.selfEnroll);

// Certificates
router.get("/my/certificates", StudentController.getMyCertificates);
router.get("/my/certificates/:courseId", StudentController.getMyCertificate);

// Activity
router.get("/my/activity", StudentController.getMyActivity);

// Progress tracking
router.put("/my/enrollments/:id/progress", StudentController.updateProgress);

// Playground
router.get("/playground/questions", StudentController.getPlaygroundQuestions);
router.get("/playground/questions/:id", StudentController.getPlaygroundQuestionById);
router.post("/playground/questions/:id/submit", StudentController.submitPlaygroundSolution);
router.get("/playground/questions/:id/submissions", StudentController.getPlaygroundSubmissions);

// Submodules (for course detail page)
router.get("/modules/:moduleId/submodules", StudentController.getSubmodulesByModule);

// Profile Stats (gamified identity)
router.get("/profile/stats", StudentController.getProfileStats);

export default router;
