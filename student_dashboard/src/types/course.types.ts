export interface ICourse {
  _id: string;
  title: string;
  description?: string;
  organisation?: string;
  isGlobal: boolean;
  status?: string;
  modules?: { _id: string; title: string }[];
  enrolledCount?: number;
  createdAt: string;
  updatedAt: string;
}
