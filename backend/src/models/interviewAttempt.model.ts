import mongoose, { Document, Schema } from "mongoose";

/** Interview Attempt — student's performance in a mock interview */
export interface IInterviewAttempt extends Document {
  student: mongoose.Types.ObjectId;
  interview: mongoose.Types.ObjectId;
  answers: {
    questionIndex: number;
    response: string;
    selfScore?: number; // self-evaluation 1-5
  }[];
  scores: {
    technicalDepth: number;   // 0-100
    communication: number;    // 0-100
    edgeCases: number;        // 0-100
    problemSolving: number;   // 0-100
  };
  overallScore: number; // 0-100
  timeTaken: number; // seconds
  completedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const interviewAttemptSchema = new Schema<IInterviewAttempt>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    interview: { type: Schema.Types.ObjectId, ref: "MockInterview", required: true, index: true },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        response: { type: String, default: "" },
        selfScore: { type: Number, min: 1, max: 5 },
      },
    ],
    scores: {
      technicalDepth: { type: Number, default: 0, min: 0, max: 100 },
      communication: { type: Number, default: 0, min: 0, max: 100 },
      edgeCases: { type: Number, default: 0, min: 0, max: 100 },
      problemSolving: { type: Number, default: 0, min: 0, max: 100 },
    },
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    timeTaken: { type: Number, default: 0 },
    completedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interviewAttemptSchema.index({ student: 1, interview: 1 });

const InterviewAttempt = mongoose.model<IInterviewAttempt>("InterviewAttempt", interviewAttemptSchema);
export default InterviewAttempt;
