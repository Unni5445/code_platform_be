import mongoose, { Schema, Document } from "mongoose";

export interface ILeaderboardRanking {
  user: mongoose.Types.ObjectId;
  score: number;
}

export interface ILeaderboard extends Document {
  batch: mongoose.Types.ObjectId;
  rankings: ILeaderboardRanking[];

  // Timestamps (automatically added by Mongoose with { timestamps: true })
  createdAt: Date;
  updatedAt: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>(
  {
    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
    },

    rankings: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        score: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

const Leaderboard = mongoose.model<ILeaderboard>(
  "Leaderboard",
  leaderboardSchema
);

export default Leaderboard;