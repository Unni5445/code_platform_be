import api from "./api";
import type { ApiResponse, IOrganisation } from "@/types";

export const organisationService = {
  getOrganisations: (params?: { search?: string }) =>
    api.get<ApiResponse<IOrganisation[]>>("/organisations", { params }),

  getOrganisationById: (id: string) =>
    api.get<ApiResponse<IOrganisation>>(`/organisations/${id}`),

  createOrganisation: (data: Partial<IOrganisation>) =>
    api.post<ApiResponse<IOrganisation>>("/organisations", data),

  updateOrganisation: (id: string, data: Partial<IOrganisation>) =>
    api.put<ApiResponse<IOrganisation>>(`/organisations/${id}`, data),

  deleteOrganisation: (id: string) =>
    api.delete<ApiResponse<object>>(`/organisations/${id}`),

  deleteBatches: (batchIds: string[]) =>
    api.delete<ApiResponse<object>>("/batches", { data: { batchIds } }),

  updateBatches: (batchIds: string[], organisationId?: string) =>
    api.put<ApiResponse<object>>("/batches", { batchIds, organisationId }),
};
