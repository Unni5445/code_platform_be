export interface IStudentSubmission {
  _id: string;
  student: string;
  question: string;
  type: string;
  answer?: string | string[];
  code?: string;
  language?: string;
  score: number;
  maxScore: number;
  passedTestCases?: number;
  totalTestCases?: number;
  feedback?: string;
  attemptedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStudentTestSubmission {
  _id: string;
  student: string;
  test: string;
  answers: {
    question: string;
    answer?: string | string[];
    code?: string;
    language?: string;
    score: number;
    maxScore: number;
  }[];
  totalScore: number;
  attemptedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
