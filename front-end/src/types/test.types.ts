export interface ITest {
  _id: string;
  title: string;
  description?: string;
  course: string;
  questions: string[];
  totalPoints?: number;
  duration?: number;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
