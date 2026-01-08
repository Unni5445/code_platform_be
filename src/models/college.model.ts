import mongoose, { Schema, Types } from "mongoose";
// import bcrypt from 'bcrypt'

const collegeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
    },
    course: {
      type: String,
    },
    // email: {
    //   type: String,
    //   unique: true,
    //   required: true,
    // },
    // password: {
    //   type: String,
    //   required: true,
    // },
    // role: {
    //   type: String,
    //   enum: ["super-admin", "admin", "student"],
    //   default: "student",
    // },
    // department:{
    //     type: String,
    //     // required: true
    // },
    // college:{
    //     type: Types.ObjectId,
    //     ref:"College",
    //     // require:
    // },
    isDeleted: {
        type: Boolean,
        default : false
    }
  },
  {
    timestamps: true,
  }
);

// collegeSchema.pre("save", async function (next) {
//   const employee = this;

//   if (!employee.isModified("password")) return next();

//   try {
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(employee.password, salt);
//     employee.password = hashedPassword;
//     next();
//   } catch (error:unknown) {
//     next((error as Error));
//   }
// });

// collegeSchema.methods.comparePassword = async function (candidatePassword:string) {
//   try {
//     const isMatch = await bcrypt.compare(candidatePassword, this.password);
//     return isMatch;
//   } catch (error) {
//     throw error;
//   }
// };

const College = mongoose.model("College", collegeSchema);

export default College;
