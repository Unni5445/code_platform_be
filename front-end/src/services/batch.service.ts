import api from "./api";
import type { ApiResponse, IBatch } from "@/types";

export const batchService = {
  getBatches: (params?: { search?: string; organisation?: string }) =>
    api.get<ApiResponse<IBatch[]>>("/batches", { params }),

  getBatchById: (id: string) =>
    api.get<ApiResponse<IBatch>>(`/batches/${id}`),

  createBatch: (data: Partial<IBatch>) =>
    api.post<ApiResponse<IBatch>>("/batches", data),

  updateBatch: (id: string, data: Partial<IBatch>) =>
    api.put<ApiResponse<IBatch>>(`/batches/${id}`, data),

  deleteBatch: (id: string) =>
    api.delete<ApiResponse<object>>(`/batches/${id}`),

  addStudents: (id: string, studentIds: string[]) =>
    api.post<ApiResponse<IBatch>>(`/batches/${id}/students`, { studentIds }),

  updateBatches: (batchIds: string[], organisationId?: string) =>
    api.put<ApiResponse<object>>("/batches", { batchIds, organisationId }),
};
