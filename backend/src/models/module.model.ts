import mongoose, { Document, Schema } from "mongoose";

export interface IModule extends Document {
  title: string;
  description?: string;
  course: mongoose.Types.ObjectId;
  test?: mongoose.Types.ObjectId; // 1:1 with Test
  order: number; // display ordering within the course
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    test: { type: Schema.Types.ObjectId, ref: "Test" },
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

moduleSchema.index({ course: 1, order: 1 });

const Module = mongoose.model<IModule>("Module", moduleSchema);
export default Module;
