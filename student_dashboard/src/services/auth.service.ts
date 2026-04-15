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

  completeOnboarding: (data: { playerClass: string; dailyGoal: number }) =>
    api.patch<ApiResponse<IUser>>("/me/onboarding", data),

  getStudentStats: () =>
    api.get<ApiResponse<{ problemsSolved: number; totalXp: number; globalRank: number; acceptance: number }>>("/me/stats"),

  getDailyQuests: () =>
    api.get<ApiResponse<Array<{ id: number; title: string; desc: string; xp: number; completed: boolean; claimed: boolean; iconName: string }>>>("/me/quests"),

  claimXp: (amount: number, questId: number) =>
    api.post<ApiResponse<IUser>>("/me/claim-xp", { amount, questId }),

  unlockHint: (questionId: string, hintIndex: number, xpCost: number) =>
    api.post<ApiResponse<IUser>>("/me/unlock-hint", { questionId, hintIndex, xpCost }),
};
