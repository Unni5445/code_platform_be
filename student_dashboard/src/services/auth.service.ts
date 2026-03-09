import api from "./api";
import type { ApiResponse, IUser } from "@/types";

export const authService = {
  signIn: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; _id: string; email: string; role: string }>>(
      "/sign-in",
      { email, password }
    ),

  signUp: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post<ApiResponse<{ token: string; _id: string; email: string; role: string }>>(
      "/sign-up",
      data
    ),

  googleAuth: (data: { email: string; name: string; googleId: string }) =>
    api.post<ApiResponse<{ token: string; _id: string; email: string; role: string }>>(
      "/google-auth",
      data
    ),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<object>>("/forgot-password", { email }),

  verifyOtp: (email: string, otp: string) =>
    api.post<ApiResponse<object>>("/verify-otp", { email, otp }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post<ApiResponse<object>>("/reset-password", { email, otp, newPassword }),

  signOut: () => api.post<ApiResponse<object>>("/sign-out"),

  getMe: () => api.get<ApiResponse<IUser>>("/me"),
};
