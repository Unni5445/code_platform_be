import api from "./api";
import type { ApiResponse } from "@/types";

export type InterviewDifficulty = "Easy" | "Medium" | "Hard" | "Boss";

export interface IInterviewQuestion {
  question: string;
  category: "technical" | "behavioral" | "system-design";
  hints: string[];
  expectedPoints: string[];
}

export interface IMockInterview {
  _id: string;
  company: string;
  role: string;
  difficulty: InterviewDifficulty;
  duration: number;
  topics: string[];
  questions: IInterviewQuestion[];
  requiredLevel: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // attached by admin endpoint
  participants?: number; 
}

export interface IMockInterviewListResponse {
  interviews: IMockInterview[];
  totalInterviews: number;
  currentPage: number;
  totalPages: number;
}

export interface IInterviewAttempt {
  _id: string;
  student: { _id: string; name: string; email: string } | string;
  interview: string;
  answers: {
    questionIndex: number;
    response: string;
    selfScore?: number;
  }[];
  scores: {
    technicalDepth: number;
    communication: number;
    edgeCases: number;
    problemSolving: number;
  };
  overallScore: number;
  timeTaken: number;
  completedAt?: string;
  createdAt: string;
}

export interface IInterviewAttemptsResponse {
  interview: { _id: string; company: string; role: string };
  attempts: IInterviewAttempt[];
  totalAttempts: number;
}

export const interviewService = {
  // Admin endpoints
  getAdminInterviews: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<IMockInterviewListResponse>>("/admin/interviews", { params }),

  createInterview: (data: Partial<IMockInterview>) =>
    api.post<ApiResponse<IMockInterview>>("/admin/interviews", data),

  updateInterview: (id: string, data: Partial<IMockInterview>) =>
    api.put<ApiResponse<IMockInterview>>(`/admin/interviews/${id}`, data),

  deleteInterview: (id: string) =>
    api.delete<ApiResponse<object>>(`/admin/interviews/${id}`),

  getInterviewAttempts: (id: string) =>
    api.get<ApiResponse<IInterviewAttemptsResponse>>(`/admin/interviews/${id}/attempts`),
};
