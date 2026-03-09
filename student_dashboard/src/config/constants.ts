export const API_BASE_URL = "/api/v1";
export const DEFAULT_PAGE_SIZE = 10;

export const ROLES = {
  STUDENT: "STUDENT",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const QUESTION_TYPES = {
  SINGLE_CHOICE: "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  CODING: "CODING",
  BEHAVIORAL: "BEHAVIORAL",
} as const;

export const DIFFICULTY_LEVELS = {
  Easy: "Easy",
  Medium: "Medium",
  Hard: "Hard",
} as const;

export const LANGUAGES = ["javascript", "python", "java", "cpp", "csharp", "ruby"] as const;
