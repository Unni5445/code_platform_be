import api from "./api";
import type { ApiResponse } from "@/types";

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalCourses: number;
  activeTests: number;
  totalTests: number;
  totalCertificates: number;
  totalQuestions: number;
  avgPoints: number;
  avgStreak: number;
}

export interface UserGrowthItem {
  month: string;
  users: number;
}

export interface TestPerformanceItem {
  name: string;
  avgScore: number;
  passRate: number;
  submissions: number;
}

export interface LeaderboardItem {
  rank: number;
  _id: string;
  name: string;
  email: string;
  points: number;
  streak: number;
  maxStreak: number;
  courses: number;
}

export interface ActivityItem {
  user: string;
  action: string;
  time: string;
  type: string;
}

export const dashboardService = {
  getStats: () =>
    api.get<ApiResponse<DashboardStats>>("/dashboard/stats"),

  getUserGrowth: () =>
    api.get<ApiResponse<UserGrowthItem[]>>("/dashboard/user-growth"),

  getTestPerformance: () =>
    api.get<ApiResponse<TestPerformanceItem[]>>("/dashboard/test-performance"),

  getLeaderboard: (params?: { limit?: number }) =>
    api.get<ApiResponse<LeaderboardItem[]>>("/dashboard/leaderboard", { params }),

  getRecentActivity: () =>
    api.get<ApiResponse<ActivityItem[]>>("/dashboard/recent-activity"),
};
