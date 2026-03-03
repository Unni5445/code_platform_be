export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "CODING" | "BEHAVIORAL";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type QuestionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface TestCase {
  input: string;
  output: string;
  hidden?: boolean;
  weight?: number;
}

export interface IQuestion {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string | string[];
  starterCode?: Record<string, string>;
  testCases?: TestCase[];
  languages?: string[];
  maxExecutionTime?: number;
  maxMemory?: number;
  points: number;
  allowPartial?: boolean;
  difficulty: Difficulty;
  course: string;
  module?: string;
  company?: string;
  tags?: string[];
  version?: number;
  status?: QuestionStatus;
  submissionLimit?: number;
  createdAt: string;
  updatedAt: string;
}
