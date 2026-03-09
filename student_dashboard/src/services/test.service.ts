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

export const testService = {
  getTestById: (id: string) =>
    api.get<ApiResponse<ITest>>(`/tests/${id}`),

  startTest: (id: string) =>
    api.post<ApiResponse<{ submissionId: string; startedAt: string }>>(`/tests/${id}/start`),

  submitTest: (id: string, answers: TestSubmissionAnswer[]) =>
    api.post<ApiResponse<TestSubmissionResult>>(`/tests/${id}/submit`, { answers }),
};
