import api from "./api";
import type { ApiResponse } from "@/types";

export interface IContest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "DRAFT" | "UPCOMING" | "LIVE" | "ENDED";
  sponsor?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: string[] | { _id: string; title: string; difficulty: string; points: number }[];
  maxParticipants?: number;
  rewards: string[];
  participants: number;
  isRegistered?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContestListResponse {
  contests: IContest[];
  currentPage: number;
  totalPages: number;
  totalContests: number;
}

export interface ContestLeaderboardEntry {
  rank: number;
  student: { _id: string; name: string; email: string };
  score: number;
  solvedCount: number;
  totalQuestions: number;
  timeTaken?: number;
}

export const contestService = {
  // Admin endpoints
  getContests: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<ContestListResponse>>("/contests", { params }),

  getContestById: (id: string) =>
    api.get<ApiResponse<IContest>>(`/contests/${id}`),

  createContest: (data: Partial<IContest>) =>
    api.post<ApiResponse<IContest>>("/admin/contests", data),

  updateContest: (id: string, data: Partial<IContest>) =>
    api.put<ApiResponse<IContest>>(`/admin/contests/${id}`, data),

  deleteContest: (id: string) =>
    api.delete<ApiResponse<object>>(`/admin/contests/${id}`),

  // Question management
  addQuestions: (contestId: string, questionIds: string[]) =>
    api.post<ApiResponse<IContest>>(`/admin/contests/${contestId}/questions`, { questionIds }),

  removeQuestion: (contestId: string, questionId: string) =>
    api.delete<ApiResponse<IContest>>(`/admin/contests/${contestId}/questions/${questionId}`),

  // Submissions
  getContestSubmissions: (contestId: string) =>
    api.get<ApiResponse<IContestSubmissionsResponse>>(`/admin/contests/${contestId}/submissions`),

  // Student endpoints (used by admin for viewing)
  getLeaderboard: (id: string) =>
    api.get<ApiResponse<{ leaderboard: ContestLeaderboardEntry[] }>>(`/contests/${id}/leaderboard`),
};

export interface IContestSubmission {
  _id: string;
  contest: string;
  student: { _id: string; name: string; email: string } | string;
  score: number;
  solvedCount: number;
  totalQuestions: number;
  startedAt: string;
  finishedAt?: string;
  timeTaken?: number;
  answers: {
    question: { _id: string; title: string; difficulty: string; points: number } | string;
    code: string;
    language: string;
    passed: boolean;
    passedTestCases: number;
    totalTestCases: number;
    score: number;
  }[];
  createdAt: string;
}

export interface IContestSubmissionsResponse {
  contest: { _id: string; title: string };
  submissions: IContestSubmission[];
  totalSubmissions: number;
}
