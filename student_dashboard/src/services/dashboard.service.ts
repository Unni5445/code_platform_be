import api from "./api";
import type { ApiResponse, ActivityLogEntry } from "@/types";

export interface LeaderboardEntry {
  _id: string;
  student: { _id: string; name: string; email: string };
  points: number;
  streak: number;
  maxStreak: number;
  lastActivityAt?: string;
}

export const dashboardService = {
  getLeaderboard: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<{ leaderboard: LeaderboardEntry[]; total: number }>>(
      "/dashboard/leaderboard",
      { params }
    ),

  getMyActivity: () =>
    api.get<ApiResponse<ActivityLogEntry[]>>("/my/activity"),
};
