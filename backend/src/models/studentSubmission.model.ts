import mongoose, { Document, Schema } from "mongoose";

/** Question Types */
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "CODING" | "BEHAVIORAL";

/** Student Submission Interface */
export interface IStudentSubmission extends Document {
  student: mongoose.Types.ObjectId;       // reference to User
  question: mongoose.Types.ObjectId;      // reference to Question
  type: QuestionType;
  answer?: string | string[];             // SCQ/MCQ answer
  code?: string;                          // submitted code
  language?: string;                       // programming language
  score: number;                           // points earned
  maxScore: number;                        // max points for question
  passedTestCases?: number;                // number of coding test cases passed
  totalTestCases?: number;
  feedback?: string;                        // optional teacher/auto feedback
  attemptedAt: Date;
  isDeleted: boolean;
}

const studentSubmissionSchema = new Schema<IStudentSubmission>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    type: { type: String, enum: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "CODING", "BEHAVIORAL"], required: true },
    answer: { type: Schema.Types.Mixed },
    code: { type: String },
    language: { type: String },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, required: true },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    feedback: { type: String },
    attemptedAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const StudentSubmission = mongoose.model<IStudentSubmission>("StudentSubmission", studentSubmissionSchema);
export default StudentSubmission;