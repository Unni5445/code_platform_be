import mongoose, { Document, Schema } from "mongoose";

/** Contest Submission — tracks a student's performance in a contest */
export interface IContestSubmission extends Document {
  contest: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  score: number;
  solvedCount: number;
  totalQuestions: number;
  startedAt: Date;
  finishedAt?: Date;
  timeTaken?: number; // seconds
  answers: {
    question: mongoose.Types.ObjectId;
    answer: any;
    code: string;
    language: string;
    passed: boolean;
    passedTestCases: number;
    totalTestCases: number;
    score: number;
  }[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const contestSubmissionSchema = new Schema<IContestSubmission>(
  {
    contest: { type: Schema.Types.ObjectId, ref: "Contest", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, default: 0 },
    solvedCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    timeTaken: { type: Number },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        answer: { type: Schema.Types.Mixed, default: null },
        code: { type: String, default: "" },
        language: { type: String, default: "javascript" },
        passed: { type: Boolean, default: false },
        passedTestCases: { type: Number, default: 0 },
        totalTestCases: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

contestSubmissionSchema.index({ contest: 1, score: -1, timeTaken: 1 });
contestSubmissionSchema.index({ contest: 1, student: 1 }, { unique: true });

const ContestSubmission = mongoose.model<IContestSubmission>("ContestSubmission", contestSubmissionSchema);
export default ContestSubmission;
