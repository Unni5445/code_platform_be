import api from "./api";
import type { ApiResponse, ICertificate } from "@/types";

export interface PaginatedCertificates {
  certificates: ICertificate[];
  currentPage: number;
  totalPages: number;
  totalCertificates: number;
}

export const certificateService = {
  getCertificates: (params?: { page?: number; limit?: number; search?: string; student?: string; course?: string }) =>
    api.get<ApiResponse<PaginatedCertificates>>("/certificates", { params }),

  getCertificateById: (id: string) =>
    api.get<ApiResponse<ICertificate>>(`/certificates/${id}`),

  createCertificate: (data: Partial<ICertificate>) =>
    api.post<ApiResponse<ICertificate>>("/certificates", data),

  deleteCertificate: (id: string) =>
    api.delete<ApiResponse<object>>(`/certificates/${id}`),

  verify: (verificationId: string) =>
    api.get<ApiResponse<ICertificate>>(`/certificates/verify/${verificationId}`),
};
