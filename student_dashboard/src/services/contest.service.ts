import api from "./api";
import type { ApiResponse } from "@/types";

// ─── Contest Types ───

export interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "UPCOMING" | "LIVE" | "ENDED";
  sponsor?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  maxParticipants?: number;
  rewards: string[];
  participants: number;
  isRegistered: boolean;
  hasSubmitted?: boolean;
  questionsCount?: number;
  questions?: {
    _id: string;
    title: string;
    difficulty: string;
    points: number;
    type: string;
    tags?: string[];
  }[];
}

export interface ContestListResponse {
  contests: Contest[];
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
  finishedAt?: string;
}

// ─── Service ───

export const contestService = {
  getContests: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<ContestListResponse>>("/contests", { params }),

  getContestById: (id: string) =>
    api.get<ApiResponse<Contest>>(`/contests/${id}`),

  register: (id: string) =>
    api.post<ApiResponse<{ registered: boolean }>>(`/contests/${id}/register`),

  getLeaderboard: (id: string) =>
    api.get<ApiResponse<{ leaderboard: ContestLeaderboardEntry[] }>>(`/contests/${id}/leaderboard`),

  getContestBattle: (id: string) =>
    api.get<ApiResponse<Contest>>(`/contests/${id}/battle`),

  startContest: (id: string) =>
    api.post<ApiResponse<{ submissionId: string; startedAt: string }>>(`/contests/${id}/start`),

  submitContest: (id: string, answers: { question: string; answer?: any; code?: string; language?: string }[]) =>
    api.post<ApiResponse<{ totalScore: number; maxScore: number; solvedCount: number }>>(`/contests/${id}/submit`, { answers }),
};
