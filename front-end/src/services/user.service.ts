import api from "./api";
import type { ApiResponse, PaginatedResponse, IUser } from "@/types";

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export const userService = {
  getUsers: (params: GetUsersParams) =>
    api.get<ApiResponse<PaginatedResponse<IUser>>>("/users", { params }),

  getUserById: (id: string) =>
    api.get<ApiResponse<IUser>>(`/users/${id}`),

  createUser: (data: Partial<IUser> & { password?: string }) =>
    api.post<ApiResponse<IUser>>("/users", data),

  updateUser: (id: string, data: Partial<IUser>) =>
    api.put<ApiResponse<IUser>>(`/users/${id}`, data),

  deleteUser: (id: string) =>
    api.delete<ApiResponse<object>>(`/users/${id}`),
};
