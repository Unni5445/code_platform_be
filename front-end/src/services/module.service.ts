import api from "./api";
import type { ApiResponse, IModule, ISubmodule } from "@/types";

export const moduleService = {
  getModulesByCourse: (courseId: string) =>
    api.get<ApiResponse<IModule[]>>(`/courses/${courseId}/modules`),

  getModuleById: (id: string) =>
    api.get<ApiResponse<IModule & { submodules: ISubmodule[] }>>(`/modules/${id}`),

  createModule: (data: Partial<IModule>) =>
    api.post<ApiResponse<IModule>>("/modules", data),

  updateModule: (id: string, data: Partial<IModule>) =>
    api.put<ApiResponse<IModule>>(`/modules/${id}`, data),

  deleteModule: (id: string) =>
    api.delete<ApiResponse<object>>(`/modules/${id}`),

  reorderModules: (moduleOrders: { id: string; order: number }[]) =>
    api.put<ApiResponse<object>>("/modules/reorder", { moduleOrders }),
};

export const submoduleService = {
  getSubmodulesByModule: (moduleId: string) =>
    api.get<ApiResponse<ISubmodule[]>>(`/modules/${moduleId}/submodules`),

  getSubmoduleById: (id: string) =>
    api.get<ApiResponse<ISubmodule>>(`/submodules/${id}`),

  createSubmodule: (data: Partial<ISubmodule>) =>
    api.post<ApiResponse<ISubmodule>>("/submodules", data),

  updateSubmodule: (id: string, data: Partial<ISubmodule>) =>
    api.put<ApiResponse<ISubmodule>>(`/submodules/${id}`, data),

  deleteSubmodule: (id: string) =>
    api.delete<ApiResponse<object>>(`/submodules/${id}`),

  reorderSubmodules: (submoduleOrders: { id: string; order: number }[]) =>
    api.put<ApiResponse<object>>("/submodules/reorder", { submoduleOrders }),
};
