import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

/**
 * User Roles
 */
export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN";

/**
 * User Interface
 */
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
  batch?: mongoose.Types.ObjectId;
  enrolledCourses?: mongoose.Types.ObjectId[];

  department?: string;
  college?: mongoose.Types.ObjectId;
  dob?: Date;
  gender?: string;

  points: number;
  streak: number;
  maxStreak: number;
  activityLog: { date: Date; count: number }[];
  isActive: boolean;
  isDeleted : boolean;

  // Timestamps (automatically added by Mongoose with { timestamps: true })
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema
 */
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      select: false, // IMPORTANT
    },

    role: {
      type: String,
      enum: ["STUDENT", "ADMIN", "SUPER_ADMIN"],
      default: "STUDENT",
    },

    googleId: {
      type: String,
    },

    otp: {
      type: String,
    },

    otpExpiry: {
      type: Date,
    },

    organisation: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
    },

    batch: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
    },

    enrolledCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    department: {
      type: String,
      trim: true,
    },

    college: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
    },

    dob: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    points: {
      type: Number,
      default: 0,
    },

    streak: {
      type: Number,
      default: 0,
    },

    maxStreak: {
      type: Number,
      default: 0,
    },

    activityLog: [
      {
        date: {
          type: Date,
          required: true,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

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

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;
