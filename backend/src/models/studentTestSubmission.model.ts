import mongoose, { Document, Schema } from "mongoose";

export interface IStudentTestSubmission extends Document {
  student: mongoose.Types.ObjectId;
  test: mongoose.Types.ObjectId;
  answers: {
    question: mongoose.Types.ObjectId;
    answer?: string | string[];
    code?: string;
    language?: string;
    score: number;
    maxScore: number;
  }[];
  totalScore: number;
  attemptedAt: Date;
  completedAt?: Date;
}

const studentTestSubmissionSchema = new Schema<IStudentTestSubmission>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    test: { type: Schema.Types.ObjectId, ref: "Test", required: true },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        answer: { type: Schema.Types.Mixed },
        code: { type: String },
        language: { type: String },
        score: { type: Number, default: 0 },
        maxScore: { type: Number, required: true },
      },
    ],
    totalScore: { type: Number, default: 0 },
    attemptedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

const StudentTestSubmission = mongoose.model<IStudentTestSubmission>(
  "StudentTestSubmission",
  studentTestSubmissionSchema
);

export default StudentTestSubmission;