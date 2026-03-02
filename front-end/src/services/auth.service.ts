import api from "./api";
import type { ApiResponse, IUser } from "@/types";

export const authService = {
  signIn: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; _id: string; email: string; role: string }>>(
      "/sign-in",
      { email, password }
    ),

  signOut: () => api.post<ApiResponse<object>>("/sign-out"),

  getMe: () => api.get<ApiResponse<IUser>>("/me"),
};
