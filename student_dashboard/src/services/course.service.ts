import api from "./api";
import type { ApiResponse, ICourse, IModule, ISubmodule } from "@/types";

export interface IBatch {
  _id: string;
  name: string;
  organisation?: string | { _id: string; name: string };
  duration: string;
  startDate: string;
  endDate: string;
}

interface PaginatedCourses {
  courses: ICourse[];
  total: number;
  page: number;
  limit: number;
}

export const courseService = {
  getCourses: (params?: { page?: number; limit?: number; search?: string }) =>
      api.get<ApiResponse<PaginatedCourses>>("/courses", { params }),

  getCourseById: (id: string) =>
    api.get<ApiResponse<ICourse>>(`/courses/${id}`),

  getModulesByCourse: (courseId: string) =>
    api.get<ApiResponse<IModule[]>>(`/courses/${courseId}/modules`),

  getSubmodulesByModule: (moduleId: string) =>
    api.get<ApiResponse<ISubmodule[]>>(`/modules/${moduleId}/submodules`),

  getCourseBatches: (courseId: string) =>
    api.get<ApiResponse<IBatch[]>>(`/courses/${courseId}/batches`),
};
