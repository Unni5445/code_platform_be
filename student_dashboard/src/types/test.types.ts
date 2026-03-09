import type { IQuestion } from "./question.types";

export interface ITest {
  _id: string;
  title: string;
  description?: string;
  course: string | { _id: string; title: string };
  module?: string;
  questions: string[] | IQuestion[];
  totalPoints?: number;
  duration?: number;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
