export interface ICourse {
  _id: string;
  title: string;
  description?: string;
  organisation?: string;
  isGlobal: boolean;
  enrolledStudents: string[];
  createdAt: string;
  updatedAt: string;
}
