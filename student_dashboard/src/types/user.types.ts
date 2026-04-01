export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN";
export type Gender = "Male" | "Female" | "Other";

export interface ActivityLogEntry {
  date: string;
  count: number;
}

export interface IUser {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  googleId?: string;
  organisation?: string | { _id: string; name: string };
  batch?: string | { _id: string; name: string };
  enrolledCourses?: string[];
  college?: string;
  department?: string;
  dob?: string;
  gender?: Gender;
  passoutYear?: number;
  points: number;
  streak: number;
  maxStreak: number;
  activityLog: ActivityLogEntry[];
  playerClass?: "Apprentice" | "Warrior" | "Champion";
  dailyGoal?: number;
  hasCompletedOnboarding: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
