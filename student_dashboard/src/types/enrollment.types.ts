export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED" | "EXPIRED";
export type ModuleProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface IModuleProgress {
  module: string;
  status: ModuleProgressStatus;
  completedSubmodules: string[];
  testSubmission?: string | { _id: string; totalScore: number; maxScore: number; completedAt?: string };
  startedAt?: string;
  completedAt?: string;
}

export interface IEnrollment {
  _id: string;
  student: string | { _id: string; name: string; email: string };
  course: string | { _id: string; title: string; description?: string };
  status: EnrollmentStatus;
  enrolledBy?: string;
  moduleProgress: IModuleProgress[];
  overallProgress: number;
  lastAccessedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
