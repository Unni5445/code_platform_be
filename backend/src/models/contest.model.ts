import mongoose, { Document, Schema } from "mongoose";

/** Contest Status */
export type ContestStatus = "DRAFT" | "UPCOMING" | "LIVE" | "ENDED";

/** Contest Interface */
export interface IContest extends Document {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  status: ContestStatus;
  sponsor?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: mongoose.Types.ObjectId[];
  maxParticipants?: number;
  rewards: string[];
  registeredStudents: mongoose.Types.ObjectId[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const contestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      enum: ["DRAFT", "UPCOMING", "LIVE", "ENDED"],
      default: "UPCOMING",
    },
    sponsor: { type: String, trim: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    maxParticipants: { type: Number },
    rewards: [{ type: String }],
    registeredStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

contestSchema.index({ status: 1, startTime: -1 });
contestSchema.index({ isDeleted: 1 });

const Contest = mongoose.model<IContest>("Contest", contestSchema);
export default Contest;
