import api from "./api";
import type { ApiResponse, IEnrollment } from "@/types";

export interface PaginatedEnrollments {
  enrollments: IEnrollment[];
  currentPage: number;
  totalPages: number;
  totalEnrollments: number;
}

export const enrollmentService = {
  enrollStudents: (courseId: string, studentIds: string[]) =>
    api.post<ApiResponse<{ enrolled: number; alreadyEnrolled: string[] }>>(
      `/courses/${courseId}/enroll`,
      { studentIds }
    ),

  getEnrollmentsByCourse: (courseId: string, params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<ApiResponse<PaginatedEnrollments>>(`/courses/${courseId}/enrollments`, { params }),

  getEnrollment: (courseId: string, studentId: string) =>
    api.get<ApiResponse<IEnrollment>>(`/courses/${courseId}/enrollments/${studentId}`),

  updateEnrollmentStatus: (id: string, status: string) =>
    api.put<ApiResponse<IEnrollment>>(`/enrollments/${id}`, { status }),

  removeEnrollment: (id: string) =>
    api.delete<ApiResponse<object>>(`/enrollments/${id}`),

  getMyEnrollments: () =>
    api.get<ApiResponse<IEnrollment[]>>("/my/enrollments"),
};
