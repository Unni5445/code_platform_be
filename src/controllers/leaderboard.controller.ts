import { NextFunction, Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler";
import Leaderboard from "../models/leaderboard.model";
import ApiResponse from "../utils/ApiResponse";
import ErrorResponse from "../utils/errorResponse";

class LeaderboardController {
  // ================= CREATE LEADERBOARD =================
  static createLeaderboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { batch, rankings } = req.body;

      if (!batch) {
        return next(new ErrorResponse("Batch is required", 400));
      }

      const existingLeaderboard = await Leaderboard.findOne({ batch });

      if (existingLeaderboard) {
        return next(new ErrorResponse("Leaderboard for this batch already exists", 400));
      }

      const leaderboard = await Leaderboard.create({
        batch,
        rankings: rankings || [],
      });

      res
        .status(201)
        .json(new ApiResponse(201, leaderboard, "Leaderboard created successfully"));
    }
  );

  // ================= GET LEADERBOARD BY ID =================
  static getLeaderboardById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const leaderboard = await Leaderboard.findById(id)
        .populate("batch", "name")
        .populate("rankings.user", "name email");

      if (!leaderboard) {
        return next(new ErrorResponse("Leaderboard not found", 404));
      }

      // Sort rankings by score in descending order
      leaderboard.rankings.sort((a, b) => b.score - a.score);

      res
        .status(200)
        .json(new ApiResponse(200, leaderboard, "Leaderboard fetched successfully"));
    }
  );

  // ================= GET LEADERBOARD BY BATCH =================
  static getLeaderboardByBatch = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { batchId } = req.params;

      const leaderboard = await Leaderboard.findOne({ batch: batchId })
        .populate("batch", "name")
        .populate("rankings.user", "name email");

      if (!leaderboard) {
        return next(new ErrorResponse("Leaderboard for this batch not found", 404));
      }

      // Sort rankings by score in descending order
      leaderboard.rankings.sort((a, b) => b.score - a.score);

      res
        .status(200)
        .json(new ApiResponse(200, leaderboard, "Leaderboard fetched successfully"));
    }
  );

  // ================= GET ALL LEADERBOARDS =================
  static getAllLeaderboards = asyncHandler(
    async (req: Request, res: Response) => {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 10, 100);

      const skip = (page - 1) * limit;

      const leaderboards = await Leaderboard.find()
        .populate("batch", "name")
        .populate("rankings.user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Sort rankings by score in descending order for each leaderboard
      leaderboards.forEach(leaderboard => {
        leaderboard.rankings.sort((a, b) => b.score - a.score);
      });

      const totalLeaderboards = await Leaderboard.countDocuments();
      const totalPages = Math.ceil(totalLeaderboards / limit);

      res.status(200).json(
        new ApiResponse(
          200,
          {
            leaderboards,
            currentPage: page,
            totalPages,
            totalLeaderboards,
          },
          "Leaderboards retrieved successfully"
        )
      );
    }
  );

  // ================= UPDATE LEADERBOARD =================
  static updateLeaderboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { batch, rankings } = req.body;

      const leaderboard = await Leaderboard.findById(id);

      if (!leaderboard) {
        return next(new ErrorResponse("Leaderboard not found", 404));
      }

      if (batch) leaderboard.batch = batch;
      if (rankings) leaderboard.rankings = rankings;

      await leaderboard.save();

      const updatedLeaderboard = await Leaderboard.findById(id)
        .populate("batch", "name")
        .populate("rankings.user", "name email");

      if (!updatedLeaderboard) {
        return next(new ErrorResponse("Leaderboard not found after update", 404));
      }

      // Sort rankings by score in descending order
      updatedLeaderboard!.rankings.sort((a, b) => b.score - a.score);

      res
        .status(200)
        .json(new ApiResponse(200, updatedLeaderboard, "Leaderboard updated successfully"));
    }
  );

  // ================= ADD OR UPDATE USER RANKING =================
  static addOrUpdateUserRanking = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { userId, score } = req.body;

      if (!userId || score === undefined) {
        return next(new ErrorResponse("User ID and score are required", 400));
      }

      const leaderboard = await Leaderboard.findById(id);

      if (!leaderboard) {
        return next(new ErrorResponse("Leaderboard not found", 404));
      }

      // Check if user already exists in rankings
      const existingRankingIndex = leaderboard.rankings.findIndex(
        ranking => ranking.user.toString() === userId
      );

      if (existingRankingIndex !== -1) {
        // Update existing ranking
        leaderboard.rankings[existingRankingIndex].score = score;
      } else {
        // Add new ranking
        leaderboard.rankings.push({
          user: userId,
          score,
        });
      }

      await leaderboard.save();

      const updatedLeaderboard = await Leaderboard.findById(id)
        .populate("batch", "name")
        .populate("rankings.user", "name email");

      if (!updatedLeaderboard) {
        return next(new ErrorResponse("Leaderboard not found after update", 404));
      }

      // Sort rankings by score in descending order
      updatedLeaderboard!.rankings.sort((a, b) => b.score - a.score);

      res
        .status(200)
        .json(new ApiResponse(200, updatedLeaderboard, "User ranking updated successfully"));
    }
  );

  // ================= DELETE LEADERBOARD =================
  static deleteLeaderboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const leaderboard = await Leaderboard.findById(id);

      if (!leaderboard) {
        return next(new ErrorResponse("Leaderboard not found", 404));
      }

      await Leaderboard.findByIdAndDelete(id);

      res
        .status(200)
        .json(new ApiResponse(200, {}, "Leaderboard deleted successfully"));
    }
  );

  // ================= REMOVE USER FROM LEADERBOARD =================
  static removeUserFromLeaderboard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id, userId } = req.params;

      const leaderboard = await Leaderboard.findById(id);

      if (!leaderboard) {
        return next(new ErrorResponse("Leaderboard not found", 404));
      }

      leaderboard.rankings = leaderboard.rankings.filter(
        ranking => ranking.user.toString() !== userId
      );

      await leaderboard.save();

      const updatedLeaderboard = await Leaderboard.findById(id)
        .populate("batch", "name")
        .populate("rankings.user", "name email");

      if (!updatedLeaderboard) {
        return next(new ErrorResponse("Leaderboard not found after update", 404));
      }

      // Sort rankings by score in descending order
      updatedLeaderboard!.rankings.sort((a, b) => b.score - a.score);

      res
        .status(200)
        .json(new ApiResponse(200, updatedLeaderboard, "User removed from leaderboard successfully"));
    }
  );
}

export default LeaderboardController;