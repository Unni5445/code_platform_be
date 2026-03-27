import mongoose, { Document, Schema } from "mongoose";

export interface ISubmodule extends Document {
  title: string;
  description?: string;
  module: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  isDeleted: boolean;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const submoduleSchema = new Schema<ISubmodule>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    module: { type: Schema.Types.ObjectId, ref: "Module", required: true },
    pdfUrl: { type: String, trim: true },
    order: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

submoduleSchema.index({ module: 1, order: 1 });

const Submodule = mongoose.model<ISubmodule>("Submodule", submoduleSchema);
export default Submodule;
