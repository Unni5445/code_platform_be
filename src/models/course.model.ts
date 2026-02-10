import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  description: string;
  roadmap: string[];
  isActive: boolean;

  // Timestamps (automatically added by Mongoose with { timestamps: true })
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    
    description: {
      type: String,
      trim: true,
    },
    
    roadmap: [
      {
        type: String,
        trim: true,
      },
    ],

    isActive: { 
      type: Boolean, 
      default: true 
    },
  },
  { timestamps: true }
);

const Course = mongoose.model<ICourse>("Course", courseSchema);

export default Course;