import api from "./api";
import type { ApiResponse, IQuestion } from "@/types";

export interface PaginatedPlaygroundQuestions {
  questions: IQuestion[];
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  availableTags: string[];
}

export interface PlaygroundSubmitResult {
  results: {
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    hidden?: boolean;
  }[];
  passed: number;
  total: number;
  allPassed: boolean;
  score: number;
}

export interface SubmissionHistoryItem {
  _id: string;
  code: string;
  language: string;
  score: number;
  maxScore: number;
  passedTestCases: number;
  totalTestCases: number;
  attemptedAt: string;
}

export const playgroundService = {
  getQuestions: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: string;
    language?: string;
    tag?: string;
  }) => api.get<ApiResponse<PaginatedPlaygroundQuestions>>("/playground/questions", { params }),

  getQuestionById: (id: string) =>
    api.get<ApiResponse<IQuestion>>(`/playground/questions/${id}`),

  submitSolution: (questionId: string, language: string, code: string) =>
    api.post<ApiResponse<PlaygroundSubmitResult>>(`/playground/questions/${questionId}/submit`, {
      language,
      code,
    }),

  getSubmissions: (questionId: string) =>
    api.get<ApiResponse<SubmissionHistoryItem[]>>(`/playground/questions/${questionId}/submissions`),
};
