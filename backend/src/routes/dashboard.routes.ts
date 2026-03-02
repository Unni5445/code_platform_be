import express from "express";
import DashboardController from "../controllers/dashboard.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

// All dashboard routes require ADMIN or SUPER_ADMIN
router.get("/dashboard/stats", protect, authorize("ADMIN", "SUPER_ADMIN"), DashboardController.getStats);
router.get("/dashboard/user-growth", protect, authorize("ADMIN", "SUPER_ADMIN"), DashboardController.getUserGrowth);
router.get("/dashboard/test-performance", protect, authorize("ADMIN", "SUPER_ADMIN"), DashboardController.getTestPerformance);
router.get("/dashboard/leaderboard", protect, authorize("ADMIN", "SUPER_ADMIN"), DashboardController.getLeaderboard);
router.get("/dashboard/recent-activity", protect, authorize("ADMIN", "SUPER_ADMIN"), DashboardController.getRecentActivity);

export default router;
