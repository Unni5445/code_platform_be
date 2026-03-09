import api from "./api";
import type { ApiResponse, IEnrollment } from "@/types";

export const enrollmentService = {
  getMyEnrollments: () =>
    api.get<ApiResponse<IEnrollment[]>>("/my/enrollments"),

  selfEnroll: (courseId: string, batchId: string) =>
    api.post<ApiResponse<IEnrollment>>(`/courses/${courseId}/self-enroll`, { batchId }),

  updateProgress: (enrollmentId: string, data: { moduleId: string; submoduleId: string; action: "complete" | "uncomplete" }) =>
    api.put<ApiResponse<IEnrollment>>(`/my/enrollments/${enrollmentId}/progress`, data),

  getMyCertificates: () =>
    api.get<ApiResponse<ICertificate[]>>("/my/certificates"),

  getMyCertificate: (courseId: string) =>
    api.get<ApiResponse<ICertificate>>(`/my/certificates/${courseId}`),
};

export interface ICertificate {
  _id: string;
  student: string | { _id: string; name: string; email: string };
  course: string | { _id: string; title: string; description?: string };
  title: string;
  issuedAt: string;
  grade?: string;
  score?: number;
  verificationLink?: string;
}
