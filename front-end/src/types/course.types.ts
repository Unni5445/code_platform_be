export interface ICourse {
  _id: string;
  title: string;
  description?: string;
  organisation?: string;
  isGlobal: boolean;
  enrolledCount?: number;
  createdAt: string;
  updatedAt: string;
}
