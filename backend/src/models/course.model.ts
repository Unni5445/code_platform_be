import mongoose, { Document, Schema } from "mongoose";

/** Course Interface */
export interface ICourse extends Document {
  title: string;
  description?: string;
  organisation: mongoose.Types.ObjectId; // which org owns this course
  enrolledStudents: mongoose.Types.ObjectId[]; // student IDs
  createdAt: Date;
  updatedAt: Date;
}

/** Course Schema */
const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    organisation: { type: Schema.Types.ObjectId, ref: "Organisation", required: true },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Course = mongoose.model<ICourse>("Course", courseSchema);
export default Course;