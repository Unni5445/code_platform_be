import express from "express";
import LeaderboardController from "../controllers/leaderboard.controller";
import { protect, authorize } from "../middlewares/authProtect";

const router = express.Router();

/**
 * ================= LEADERBOARD CRUD ROUTES
 */
router
  .route("/leaderboards")
  .get(protect, LeaderboardController.getAllLeaderboards)
  .post(protect, authorize("ADMIN", "SUPER_ADMIN"), LeaderboardController.createLeaderboard);

router
  .route("/leaderboards/:id")
  .get(protect, LeaderboardController.getLeaderboardById)
  .put(protect, authorize("ADMIN", "SUPER_ADMIN"), LeaderboardController.updateLeaderboard)
  .delete(protect, authorize("ADMIN", "SUPER_ADMIN"), LeaderboardController.deleteLeaderboard);

/**
 * ================= LEADERBOARD BY BATCH
 */
router.get(
  "/leaderboards/batch/:batchId",
  protect,
  LeaderboardController.getLeaderboardByBatch
);

/**
 * ================= LEADERBOARD USER RANKING MANAGEMENT
 */
router.put(
  "/leaderboards/:id/ranking",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  LeaderboardController.addOrUpdateUserRanking
);

router.delete(
  "/leaderboards/:id/users/:userId",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  LeaderboardController.removeUserFromLeaderboard
);

export default router;