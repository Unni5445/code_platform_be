export type BatchDuration = "1 month" | "3 months" | "6 months" | "1 year" | "2 years";

export interface IBatch {
  _id: string;
  name: string;
  organisation: string;
  duration: BatchDuration;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}
