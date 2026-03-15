import api from "./api";
import type { ApiResponse, ITest } from "@/types";

export interface TestSubmissionAnswer {
  question: string;
  answer?: string | string[];
  code?: string;
  language?: string;
}

export interface TestSubmissionResult {
  _id: string;
  totalScore: number;
  maxScore: number;
  answers: {
    question: string;
    score: number;
    maxScore: number;
    isCorrect?: boolean;
    testCaseResults?: { passed: boolean; input: string; expected: string; actual: string }[];
  }[];
}

export interface SubmissionDetail {
  _id: string;
  test: {
    _id: string;
    title: string;
    description?: string;
    duration?: number;
    totalPoints?: number;
  };
  answers: {
    question: {
      _id: string;
      title: string;
      type: string;
      difficulty: string;
      points: number;
      options?: { text: string; _id: string }[];
      description?: string;
    };
    answer?: string | string[];
    code?: string;
    language?: string;
    score: number;
    maxScore: number;
  }[];
  totalScore: number;
  attemptedAt: string;
  completedAt?: string;
}

export const testService = {
  getTestById: (id: string) =>
    api.get<ApiResponse<ITest>>(`/tests/${id}`),

  startTest: (id: string) =>
    api.post<ApiResponse<{ submissionId: string; startedAt: string }>>(`/tests/${id}/start`),

  submitTest: (id: string, answers: TestSubmissionAnswer[]) =>
    api.post<ApiResponse<TestSubmissionResult>>(`/tests/${id}/submit`, { answers }),

  getSubmission: (id: string) =>
    api.get<ApiResponse<SubmissionDetail>>(`/submissions/${id}`),
};
