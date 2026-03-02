import mongoose, { Document, Schema } from "mongoose";

/** Organisation Interface */
export interface IOrganisation extends Document {
  name: string; // organization name
  address?: string;
  admin?: mongoose.Types.ObjectId; // reference to User with role ADMIN
  students?: mongoose.Types.ObjectId[]; // optional array of student IDs
  courses?: mongoose.Types.ObjectId[]; // courses offered by the org
  createdAt: Date;
  updatedAt: Date;
}

/** Organisation Schema */
const organisationSchema = new Schema<IOrganisation>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, trim: true },

    /** Admin of this organization */
    admin: { type: Schema.Types.ObjectId, ref: "User" },

    /** Students in this organization (optional) */
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],

    /** Courses offered by this organization */
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

const Organisation = mongoose.model<IOrganisation>("Organisation", organisationSchema);
export default Organisation;