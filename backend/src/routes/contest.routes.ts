import express from "express";
import ContestController from "../controllers/contest.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student routes
router.get("/contests", ContestController.getContests);
router.get("/contests/:id", ContestController.getContestById);
router.post("/contests/:id/register", ContestController.registerForContest);
router.get("/contests/:id/battle", ContestController.getContestBattle);
router.post("/contests/:id/start", ContestController.startContest);
router.post("/contests/:id/submit", ContestController.submitContest);
router.get("/contests/:id/leaderboard", ContestController.getContestLeaderboard);

// Admin routes
router.post("/admin/contests", authorize("ADMIN", "SUPER_ADMIN"), ContestController.createContest);
router.put("/admin/contests/:id", authorize("ADMIN", "SUPER_ADMIN"), ContestController.updateContest);
router.delete("/admin/contests/:id", authorize("ADMIN", "SUPER_ADMIN"), ContestController.deleteContest);
router.post("/admin/contests/:id/questions", authorize("ADMIN", "SUPER_ADMIN"), ContestController.addQuestions);
router.delete("/admin/contests/:id/questions/:questionId", authorize("ADMIN", "SUPER_ADMIN"), ContestController.removeQuestion);
router.get("/admin/contests/:id/submissions", authorize("ADMIN", "SUPER_ADMIN"), ContestController.getContestSubmissions);

export default router;
