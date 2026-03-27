import mongoose, { Document, Schema } from "mongoose";

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED" | "EXPIRED";
export type ModuleProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface IModuleProgress {
  module: mongoose.Types.ObjectId;
  status: ModuleProgressStatus;
  completedSubmodules: mongoose.Types.ObjectId[];
  testSubmission?: mongoose.Types.ObjectId; // ref to StudentTestSubmission
  startedAt?: Date;
  completedAt?: Date;
}

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  status: EnrollmentStatus;
  enrolledBy?: mongoose.Types.ObjectId; // admin who enrolled the student
  moduleProgress: IModuleProgress[];
  overallProgress: number; // 0–100, computed on save
  lastAccessedAt?: Date;
  completedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const moduleProgressSchema = new Schema<IModuleProgress>(
  {
    module: { type: Schema.Types.ObjectId, ref: "Module", required: true },
    status: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"],
      default: "NOT_STARTED",
    },
    completedSubmodules: [{ type: Schema.Types.ObjectId, ref: "Submodule" }],
    testSubmission: { type: Schema.Types.ObjectId, ref: "StudentTestSubmission" },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: false }
);

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "DROPPED", "EXPIRED"],
      default: "ACTIVE",
    },
    enrolledBy: { type: Schema.Types.ObjectId, ref: "User" },
    moduleProgress: [moduleProgressSchema],
    overallProgress: { type: Number, default: 0, min: 0, max: 100 },
    lastAccessedAt: { type: Date },
    completedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });

const Enrollment = mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);
export default Enrollment;
