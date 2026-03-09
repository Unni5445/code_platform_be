export interface ILeaderboard {
  _id: string;
  student: string;
  organisation?: string;
  batch?: string;
  points: number;
  streak: number;
  maxStreak: number;
  rank?: number;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}
