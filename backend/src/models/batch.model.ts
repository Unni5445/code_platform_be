import mongoose, { Document, Schema } from "mongoose";

/** Batch Interface */
export const BATCH_DURATIONS = ["1 month", "3 months", "6 months", "1 year", "2 years"] as const;
export type BatchDuration = (typeof BATCH_DURATIONS)[number];

export interface IBatch extends Document {
  name: string; // e.g., "Batch A" or "2026 Cohort"
  organisation: mongoose.Types.ObjectId; // which org this batch belongs to
  duration: BatchDuration;
  startDate: Date;
  endDate: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Batch Schema */
const batchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true, trim: true },
    organisation: { type: Schema.Types.ObjectId, ref: "Organisation", required: false },
    duration: { type: String, required: true, enum: BATCH_DURATIONS },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Batch = mongoose.model<IBatch>("Batch", batchSchema);
export default Batch;