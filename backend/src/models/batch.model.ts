import mongoose, { Document, Schema } from "mongoose";

/** Batch Interface */
export interface IBatch extends Document {
  name: string; // e.g., "Batch A" or "2026 Cohort"
  organisation: mongoose.Types.ObjectId; // which org this batch belongs to
  students: mongoose.Types.ObjectId[]; // student IDs
  createdAt: Date;
  updatedAt: Date;
}

/** Batch Schema */
const batchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true, trim: true },
    organisation: { type: Schema.Types.ObjectId, ref: "Organisation", required: false },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Batch = mongoose.model<IBatch>("Batch", batchSchema);
export default Batch;