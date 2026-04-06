import mongoose, { Document, Schema } from "mongoose";

/** Mock Interview Difficulty */
export type InterviewDifficulty = "Easy" | "Medium" | "Hard" | "Boss";

/** Interview Question embedded schema */
export interface IInterviewQuestion {
  question: string;
  category: "technical" | "behavioral" | "system-design";
  hints: string[];
  expectedPoints: string[];
}

/** Mock Interview Interface */
export interface IMockInterview extends Document {
  company: string;
  role: string;
  difficulty: InterviewDifficulty;
  duration: number; // minutes
  topics: string[];
  questions: IInterviewQuestion[];
  requiredLevel: number; // minimum XP level to unlock
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const interviewQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    category: {
      type: String,
      enum: ["technical", "behavioral", "system-design"],
      required: true,
    },
    hints: [{ type: String }],
    expectedPoints: [{ type: String }],
  },
  { _id: false }
);

const mockInterviewSchema = new Schema<IMockInterview>(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Boss"],
      default: "Medium",
    },
    duration: { type: Number, default: 45 },
    topics: [{ type: String, trim: true }],
    questions: [interviewQuestionSchema],
    requiredLevel: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

mockInterviewSchema.index({ difficulty: 1 });
mockInterviewSchema.index({ company: 1 });

const MockInterview = mongoose.model<IMockInterview>("MockInterview", mockInterviewSchema);
export default MockInterview;
