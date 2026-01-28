import mongoose, { Schema, Document } from "mongoose";

export interface IBatch extends Document {
  name: string;
  course: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
}

const batchSchema = new Schema<IBatch>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Batch = mongoose.model<IBatch>("Batch", batchSchema);

export default Batch;