import mongoose, { Document, Schema } from "mongoose";

/** Course Interface */
export interface ICourse extends Document {
  title: string;
  description?: string;
  organisation?: mongoose.Types.ObjectId; // null = global course, set = org-specific
  isGlobal: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Course Schema */
const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    organisation: { type: Schema.Types.ObjectId, ref: "Organisation" },
    isGlobal: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

courseSchema.index({ isGlobal: 1, organisation: 1 });

const Course = mongoose.model<ICourse>("Course", courseSchema);
export default Course;