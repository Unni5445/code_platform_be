import mongoose, { Document, Schema } from "mongoose";

export interface ITest extends Document {
  title: string;
  description?: string;
  course: mongoose.Types.ObjectId;
  module?: mongoose.Types.ObjectId; // 1:1 with Module
  questions: mongoose.Types.ObjectId[]; // array of question IDs
  totalPoints?: number;
  duration?: number; // in minutes
  startTime?: Date;
  endTime?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    module: { type: Schema.Types.ObjectId, ref: "Module" },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question", required: true }],
    totalPoints: { type: Number, default: 0 },
    duration: { type: Number, default: 60 },
    startTime: { type: Date },
    endTime: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Test = mongoose.model<ITest>("Test", testSchema);
export default Test;