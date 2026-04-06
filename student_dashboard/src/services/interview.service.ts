import api from "./api";
import type { ApiResponse } from "@/types";

// ─── Interview Types ───

export interface MockInterviewItem {
  _id: string;
  company: string;
  role: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Boss";
  duration: number;
  topics: string[];
  questions: {
    question: string;
    category: "technical" | "behavioral" | "system-design";
    hints: string[];
  }[];
  requiredLevel: number;
  attempts: number;
  bestScore: number | null;
  status: "available" | "completed" | "locked";
}

export interface InterviewAttemptResult {
  _id: string;
  overallScore: number;
  scores: {
    technicalDepth: number;
    communication: number;
    edgeCases: number;
    problemSolving: number;
  };
  timeTaken: number;
}

export interface InterviewStats {
  totalAttempts: number;
  averageScore: number;
  scores: {
    technicalDepth: number;
    communication: number;
    edgeCases: number;
    problemSolving: number;
  };
  interviewsCompleted: number;
}

export interface InterviewDetail extends MockInterviewItem {
  attemptHistory: {
    _id: string;
    overallScore: number;
    scores: {
      technicalDepth: number;
      communication: number;
      edgeCases: number;
      problemSolving: number;
    };
    timeTaken: number;
    completedAt: string;
  }[];
}

// ─── Service ───

export const interviewService = {
  getInterviews: (params?: { difficulty?: string; company?: string }) =>
    api.get<ApiResponse<MockInterviewItem[]>>("/interviews", { params }),

  getInterviewById: (id: string) =>
    api.get<ApiResponse<InterviewDetail>>(`/interviews/${id}`),

  getStats: () =>
    api.get<ApiResponse<InterviewStats>>("/interviews/stats"),

  submitAttempt: (
    id: string,
    data: {
      answers: { questionIndex: number; response: string; selfScore?: number }[];
      timeTaken: number;
    }
  ) => api.post<ApiResponse<InterviewAttemptResult>>(`/interviews/${id}/attempt`, data),
};
