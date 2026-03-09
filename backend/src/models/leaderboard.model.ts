import mongoose, { Document, Schema } from "mongoose";

/** Leaderboard Entry Interface */
export interface ILeaderboard extends Document {
  student: mongoose.Types.ObjectId; // reference to User
  organisation?: mongoose.Types.ObjectId; // optional: org leaderboard
  batch?: mongoose.Types.ObjectId; // optional: batch leaderboard
  points: number; // total points
  streak: number; // current streak
  maxStreak: number; // personal best streak
  rank?: number; // optional, calculated field
  lastActivity: Date; // last activity date
  createdAt: Date;
  updatedAt: Date;
}

/** Leaderboard Schema */
const leaderboardSchema = new Schema<ILeaderboard>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    organisation: { type: Schema.Types.ObjectId, ref: "Organisation" },
    batch: { type: Schema.Types.ObjectId, ref: "Batch" },
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    rank: { type: Number }, // optional, can be calculated when querying
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Leaderboard = mongoose.model<ILeaderboard>("Leaderboard", leaderboardSchema);
export default Leaderboard;