import api from "./api";
import type { ApiResponse, ITest, IQuestion } from "@/types";

export interface PaginatedTests {
  tests: ITest[];
  currentPage: number;
  totalPages: number;
  totalTests: number;
}

export interface PaginatedQuestions {
  questions: IQuestion[];
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
}

export const testService = {
  getTests: (params?: { page?: number; limit?: number; search?: string; course?: string; isActive?: string }) =>
    api.get<ApiResponse<PaginatedTests>>("/tests", { params }),

  getTestById: (id: string) =>
    api.get<ApiResponse<ITest>>(`/tests/${id}`),

  createTest: (data: Partial<ITest>) =>
    api.post<ApiResponse<ITest>>("/tests", data),

  updateTest: (id: string, data: Partial<ITest>) =>
    api.put<ApiResponse<ITest>>(`/tests/${id}`, data),

  deleteTest: (id: string) =>
    api.delete<ApiResponse<object>>(`/tests/${id}`),
};

export const questionService = {
  getQuestions: (params?: { page?: number; limit?: number; search?: string; type?: string; difficulty?: string; course?: string; tag?: string }) =>
    api.get<ApiResponse<PaginatedQuestions>>("/questions", { params }),

  getQuestionById: (id: string) =>
    api.get<ApiResponse<IQuestion>>(`/questions/${id}`),

  createQuestion: (data: Partial<IQuestion>) =>
    api.post<ApiResponse<IQuestion>>("/questions", data),

  updateQuestion: (id: string, data: Partial<IQuestion>) =>
    api.put<ApiResponse<IQuestion>>(`/questions/${id}`, data),

  deleteQuestion: (id: string) =>
    api.delete<ApiResponse<object>>(`/questions/${id}`),

  bulkImportQuestions: (questions: Partial<IQuestion>[]) =>
    api.post<ApiResponse<{ imported: number; questions: IQuestion[] }>>("/questions/bulk-import", { questions }),
};
