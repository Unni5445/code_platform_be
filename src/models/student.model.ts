import mongoose, { Schema, Types } from "mongoose";
import bcrypt from 'bcrypt'

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    department:{
        type: String,
        required: true
    },
    college:{
        type: Types.ObjectId,
        ref:"College",
        require:true
    },
    isDeleted:{
        type: Boolean,
        default: false
    }
  },
  {
    timestamps: true,
  }
);

studentSchema.pre("save", async function (next) {
  const student = this;

  if (!student.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(student.password, salt);
    student.password = hashedPassword;
    next();
  } catch (error:unknown) {
    next((error as Error));
  }
});

studentSchema.methods.comparePassword = async function (candidatePassword:string) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (error) {
    throw error;
  }
};

const Student = mongoose.model("Student", studentSchema);

export default Student;
