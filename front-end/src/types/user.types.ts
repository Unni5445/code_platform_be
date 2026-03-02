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
  password?: string;
  role: UserRole;
  googleId?: string;
  organisation?: string | IOrganisation;
  batch?: string | IBatch;
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
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Forward declarations for populated fields
interface IOrganisation {
  _id: string;
  name: string;
}
interface IBatch {
  _id: string;
  name: string;
}
