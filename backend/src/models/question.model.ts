import mongoose, { Document, Schema } from "mongoose";

/** Question Types */
export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "CODING"
  | "BEHAVIORAL";

const ALLOWED_LANGUAGES = [
  "javascript",
  "python",
  "java",
  "cpp",
  "c",
];

export interface ITestCase {
  input: string;
  output: string;
  hidden?: boolean;
  weight?: number;
}

export interface IQuestion extends Document {
  title: string;
  slug: string;
  description?: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string | string[];
  starterCode?: Record<string, string>; // language -> starter code
  testCases?: ITestCase[];
  languages?: string[];
  hints: string[];
  maxExecutionTime: number;
  maxMemory: number;
  points: number;
  allowPartial: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  test?: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  module?: mongoose.Types.ObjectId;
  company?: string;
  tags?: string[];
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  submissionLimit?: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    hidden: { type: Boolean, default: true }, // hidden by default
    weight: { type: Number, default: 1, min: 0 },
  },
  { _id: false }
);

const questionSchema = new Schema<IQuestion>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },

    description: { type: String },

    type: {
      type: String,
      enum: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "CODING", "BEHAVIORAL"],
      required: true,
    },

    options: {
      type: [String],
      validate: {
        validator: function (value: string[]) {
          if (this.type === "SINGLE_CHOICE" || this.type === "MULTIPLE_CHOICE") {
            return value && value.length > 1;
          }
          return true;
        },
        message: "Options required for choice-based questions",
      },
    },

    correctAnswer: { type: Schema.Types.Mixed },

    starterCode: {
      type: Map,
      of: String, // language -> code
    },

    testCases: {
      type: [testCaseSchema],
      validate: {
        validator: function (value: ITestCase[]) {
          if (this.type === "CODING") {
            return value && value.length > 0;
          }
          return true;
        },
        message: "Test cases required for coding questions",
      },
    },

    languages: [
      {
        type: String,
        enum: ALLOWED_LANGUAGES,
      },
    ],

    hints: [String],

    maxExecutionTime: { type: Number, default: 2, min: 1 },
    maxMemory: { type: Number, default: 128, min: 64 },

    points: { type: Number, default: 0, min: 0 },
    allowPartial: { type: Boolean, default: true },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },

    test: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      index: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      index: true,
    },

    module: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      index: true,
    },

    company: { type: String, trim: true },
    tags: [{ type: String, trim: true, index: true }],

    version: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },

    submissionLimit: { type: Number, default: 5 },

    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

/** Indexes for production filtering */
questionSchema.index({ difficulty: 1 });
questionSchema.index({ type: 1 });
questionSchema.index({ course: 1, status: 1 });
questionSchema.index({ tags: 1 });

/** Hide sensitive fields when sending to client */
questionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.testCases) {
    obj.testCases = obj.testCases.filter((tc: ITestCase) => !tc.hidden);
  }
  if (obj.starterCode instanceof Map) {
    obj.starterCode = Object.fromEntries(obj.starterCode);
  }
  delete obj.isDeleted;
  return obj;
};

const Question = mongoose.model<IQuestion>("Question", questionSchema);

export default Question;