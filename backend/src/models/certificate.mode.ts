import mongoose, { Document, Schema } from "mongoose";

export interface ICertificate extends Document {
  student: mongoose.Types.ObjectId;       // reference to User
  course?: mongoose.Types.ObjectId;       // reference to Course
  test?: mongoose.Types.ObjectId;         // reference to Test
  title: string;                          // e.g., "JavaScript Basics Completion"
  issuedAt: Date;
  certificateUrl?: string;                // PDF file URL
  qrCodeUrl?: string;                     // URL to QR code image
  verificationLink?: string;              // link for verification
  grade?: string;                         // e.g., "A+", "Passed"
  score?: number;                         // total score
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    test: { type: Schema.Types.ObjectId, ref: "Test" },
    title: { type: String, required: true, trim: true },
    issuedAt: { type: Date, default: Date.now },
    certificateUrl: { type: String, trim: true },
    qrCodeUrl: { type: String, trim: true },
    verificationLink: { type: String, trim: true },
    grade: { type: String },
    score: { type: Number },
  },
  { timestamps: true }
);

const Certificate = mongoose.model<ICertificate>("Certificate", certificateSchema);
export default Certificate;