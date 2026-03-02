export interface ICourse {
  _id: string;
  title: string;
  description?: string;
  organisation: string;
  enrolledStudents: string[];
  createdAt: string;
  updatedAt: string;
}
