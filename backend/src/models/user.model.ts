import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

/** User Roles */
export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN";

/** Activity Log Interface */
interface ActivityLogEntry {
  date: Date;
  count: number; // number of actions done that day
}

/** User Interface */
export interface IUser extends Document {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role: UserRole;

  googleId?: string;
  otp?: string;
  otpExpiry?: Date;

  organisation?: mongoose.Types.ObjectId;

  department?: string;
  dob?: Date;
  gender?: "Male" | "Female" | "Other";
  passoutYear?: number;

  points: number;
  streak: number;
  maxStreak: number;
  activityLog: ActivityLogEntry[];

  isActive: boolean;
  isDeleted: boolean;

  refreshToken?: string;
  refreshTokenExpiry?: Date;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

/** Schema Definition */
const userSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["STUDENT", "ADMIN", "SUPER_ADMIN"], default: "STUDENT" },

    googleId: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },

    organisation: { type: Schema.Types.ObjectId, ref: "Organisation" },

    department: { type: String, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    passoutYear: { type: Number },

    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    activityLog: [
      {
        date: { type: Date, required: true },
        count: { type: Number, default: 0 },
      },
    ],

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    refreshToken: { type: String },
    refreshTokenExpiry: { type: Date },
  },
  { timestamps: true }
);

/** Hash password before saving */
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/** Compare password method */
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;