import api from "./api";
import type { ApiResponse, ICourse } from "@/types";

export interface PaginatedCourses {
  courses: ICourse[];
  currentPage: number;
  totalPages: number;
  totalCourses: number;
}

export const courseService = {
  getCourses: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<ApiResponse<PaginatedCourses>>("/courses", { params }),

  getCourseById: (id: string) =>
    api.get<ApiResponse<ICourse>>(`/courses/${id}`),

  createCourse: (data: Partial<ICourse>) =>
    api.post<ApiResponse<ICourse>>("/courses", data),

  updateCourse: (id: string, data: Partial<ICourse>) =>
    api.put<ApiResponse<ICourse>>(`/courses/${id}`, data),

  deleteCourse: (id: string) =>
    api.delete<ApiResponse<object>>(`/courses/${id}`),

  enrollStudents: (id: string, studentIds: string[]) =>
    api.post<ApiResponse<ICourse>>(`/courses/${id}/enroll`, { studentIds }),
};
